/**
 * Calcula el estado del partido (marcador, sets, quién saca, ganador,
 * tiempos muertos, cambios y avisos) "reproduciendo" la lista de eventos
 * desde el principio.
 *
 * Ventaja: deshacer o borrar cualquier acción es trivial, porque el marcador
 * se recalcula solo. Ver docs/adr/ADR-002-partido-como-eventos.md.
 */
import { isMirrorPair, pointOutcome } from './skills';
import type { ActionEvent, Match, MatchEvent, MatchSettings, TeamSide } from './types';
import { otherSide } from './types';

/** Límites por set y por equipo según el reglamento FIVB. */
export const TIMEOUTS_PER_SET = 2;
export const SUBSTITUTIONS_PER_SET = 6;

export interface Score {
  home: number;
  away: number;
}

export interface SetResult extends Score {
  /** Ganador del set, o null si se está jugando. */
  winner: TeamSide | null;
  /** Tiempos muertos pedidos por cada equipo en este set. */
  timeouts: Score;
  /** Cambios hechos por cada equipo en este set. */
  substitutions: Score;
}

/**
 * Avisos de posibles errores de carga. No impiden registrar: solo avisan.
 * Ver docs/04-reglas-de-juego.md.
 */
export type RallyWarning =
  | 'serve-wrong-team' // saca el equipo que no tenía el saque
  | 'rally-not-closed' // empieza un saque sin que el rally anterior terminara en punto
  | 'reception-by-server' // recibe el mismo equipo que saca
  | 'timeout-limit' // más tiempos muertos de los permitidos en el set
  | 'substitution-limit'; // más cambios de los permitidos en el set

/** Información calculada para cada evento (útil para el historial y las estadísticas). */
export interface EventInfo {
  /** Índice del set en el que ocurrió (0 = primer set). */
  setIndex: number;
  /** Quién ganó el punto con este evento (null si no terminó el rally). */
  pointTo: TeamSide | null;
  /** Si este evento repite un punto ya contado, id del evento original. */
  mirrorOf: string | null;
  /** Equipo que sacaba cuando ocurrió el evento. */
  servingTeam: TeamSide;
  /** Marcador del set después del evento. */
  scoreAfter: Score;
  /** true si se registró con el partido ya terminado (no suma puntos). */
  afterEnd: boolean;
  /** Posibles errores de carga detectados en este evento. */
  warnings: RallyWarning[];
}

export interface MatchState {
  sets: SetResult[];
  currentSetIndex: number;
  setsWon: Score;
  serving: TeamSide;
  finished: boolean;
  winner: TeamSide | null;
  info: Record<string, EventInfo>;
}

/** Sets que hay que ganar para llevarse el partido (2 de 3, o 3 de 5). */
export function setsToWin(settings: MatchSettings): number {
  return Math.ceil(settings.bestOf / 2);
}

export function isTiebreak(settings: MatchSettings, setIndex: number): boolean {
  return setIndex === settings.bestOf - 1;
}

export function pointsTarget(settings: MatchSettings, setIndex: number): number {
  return isTiebreak(settings, setIndex) ? settings.pointsTiebreak : settings.pointsPerSet;
}

/**
 * Quién saca al empezar cada set. Se alterna set a set. En el set decisivo el
 * reglamento usa un nuevo sorteo: la interfaz pide elegirlo y lo registra con
 * un evento 'serve' (ver ServeChangeEvent).
 */
export function firstServerOfSet(settings: MatchSettings, setIndex: number): TeamSide {
  return setIndex % 2 === 0 ? settings.firstServe : otherSide(settings.firstServe);
}

/** Calcula quién gana el punto con un evento, sin tener en cuenta espejos. */
function rawPointTo(event: MatchEvent): TeamSide | null {
  if (event.type === 'point') return event.team;
  if (event.type !== 'action') return null;
  const outcome = pointOutcome(event.skill, event.quality);
  if (outcome === 'self') return event.team;
  if (outcome === 'opponent') return otherSide(event.team);
  return null;
}

function newSet(): SetResult {
  return { home: 0, away: 0, winner: null, timeouts: { home: 0, away: 0 }, substitutions: { home: 0, away: 0 } };
}

export function computeMatchState(match: Match): MatchState {
  const { settings } = match;
  const sets: SetResult[] = [newSet()];
  const setsWon: Score = { home: 0, away: 0 };
  const info: Record<string, EventInfo> = {};
  let serving: TeamSide = firstServerOfSet(settings, 0);
  let finished = false;
  let winner: TeamSide | null = null;

  // Último evento que dio un punto (para detectar espejos), con su info.
  let lastPoint: { event: ActionEvent; info: EventInfo } | null = null;
  // true si hubo acciones desde el último punto (el rally está en juego).
  let rallyOpen = false;

  for (const event of match.events) {
    const setIndex = sets.length - 1;
    const current = sets[setIndex]!;
    const pointTo = rawPointTo(event);

    // ¿Es el "espejo" del punto anterior? Entonces no suma otra vez.
    if (pointTo && event.type === 'action' && lastPoint && isMirrorPair(lastPoint.event, event)) {
      info[event.id] = { ...lastPoint.info, pointTo: null, mirrorOf: lastPoint.event.id, warnings: [] };
      lastPoint = null;
      continue;
    }

    const servingTeam = serving;
    const base = { setIndex, mirrorOf: null, servingTeam, afterEnd: finished };
    const score = () => ({ home: current.home, away: current.away });

    if (finished) {
      info[event.id] = { ...base, pointTo: null, scoreAfter: score(), warnings: [] };
      continue;
    }

    const warnings: RallyWarning[] = [];

    // Eventos que no son parte del rally
    if (event.type === 'timeout' || event.type === 'substitution') {
      if (event.type === 'timeout') {
        current.timeouts[event.team] += 1;
        if (current.timeouts[event.team] > TIMEOUTS_PER_SET) warnings.push('timeout-limit');
      } else {
        current.substitutions[event.team] += 1;
        if (current.substitutions[event.team] > SUBSTITUTIONS_PER_SET) warnings.push('substitution-limit');
      }
      info[event.id] = { ...base, pointTo: null, scoreAfter: score(), warnings };
      continue;
    }
    if (event.type === 'serve') {
      serving = event.team;
      rallyOpen = false;
      lastPoint = null;
      info[event.id] = { ...base, pointTo: null, scoreAfter: score(), warnings };
      continue;
    }

    // Avisos de lógica del rally
    if (event.type === 'action') {
      if (event.skill === 'S') {
        if (event.team !== servingTeam) warnings.push('serve-wrong-team');
        if (rallyOpen) warnings.push('rally-not-closed');
      }
      if (event.skill === 'R' && event.team === servingTeam) warnings.push('reception-by-server');
    }

    if (pointTo) {
      current[pointTo] += 1;
      serving = pointTo; // quien gana el punto, saca
      rallyOpen = false;
    } else {
      rallyOpen = true;
    }

    const eventInfo: EventInfo = { ...base, pointTo, scoreAfter: score(), warnings };
    info[event.id] = eventInfo;
    lastPoint = pointTo && event.type === 'action' ? { event, info: eventInfo } : null;

    // ¿Terminó el set?
    if (pointTo) {
      const target = pointsTarget(settings, setIndex);
      const diff = current[pointTo] - current[otherSide(pointTo)];
      if (current[pointTo] >= target && diff >= 2) {
        current.winner = pointTo;
        setsWon[pointTo] += 1;
        if (setsWon[pointTo] >= setsToWin(settings)) {
          finished = true;
          winner = pointTo;
        } else {
          sets.push(newSet());
          serving = firstServerOfSet(settings, sets.length - 1);
        }
      }
    }
  }

  return {
    sets,
    currentSetIndex: sets.length - 1,
    setsWon,
    serving,
    finished,
    winner,
    info,
  };
}

/** true si en el set actual todavía no se registró ningún evento. */
export function isSetUntouched(match: Match, state: MatchState): boolean {
  return !match.events.some((e) => state.info[e.id]?.setIndex === state.currentSetIndex);
}

/**
 * true si hay que preguntar quién saca: es el set decisivo y todavía no se
 * registró nada en él.
 */
export function needsTiebreakServeChoice(match: Match, state: MatchState): boolean {
  return !state.finished && isTiebreak(match.settings, state.currentSetIndex) && isSetUntouched(match, state);
}
