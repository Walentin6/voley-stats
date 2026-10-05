/**
 * Calcula el estado del partido (marcador, sets, quién saca, ganador,
 * tiempos muertos, cambios, rotaciones y avisos) "reproduciendo" la lista de
 * eventos desde el principio.
 *
 * Ventaja: deshacer o borrar cualquier acción es trivial, porque el marcador
 * se recalcula solo. Ver docs/adr/ADR-002-partido-como-eventos.md.
 */
import { isLibero, rotate, rotationLabel, type Lineup } from './rotation';
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
  | 'substitution-limit' // más cambios de los permitidos en el set
  | 'wrong-server' // saca un jugador que no está en la posición 1
  | 'player-not-on-court' // acción de un jugador que no está en cancha
  | 'sub-not-on-court' // en un cambio, el que sale no estaba en cancha
  | 'sub-already-on-court' // en un cambio, el que entra ya estaba en cancha
  | 'libero-substitution'; // se registró un cambio con el líbero (no hace falta)

/** Formación de un equipo en un momento dado. */
export interface CourtSnapshot {
  /** Números por posición: índice 0 = P1 (saca), ..., 5 = P6. */
  positions: Lineup;
  /** Nombre de la rotación: P1..P6 (posición del armador) o R1..R6. */
  label: string;
}

export type Courts = Record<TeamSide, CourtSnapshot | null>;

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
  /** Formación de cada equipo cuando ocurrió el evento (null = sin formación cargada). */
  courts: Courts;
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
  /** Formación actual de cada equipo (null si no se cargó en este set). */
  courts: Courts;
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

/** Estado interno de la formación de un equipo durante la reproducción. */
interface CourtTracker {
  positions: Lineup;
  rotationsSinceLineup: number;
}

export function computeMatchState(match: Match): MatchState {
  const { settings } = match;
  const sets: SetResult[] = [newSet()];
  const setsWon: Score = { home: 0, away: 0 };
  const info: Record<string, EventInfo> = {};
  let serving: TeamSide = firstServerOfSet(settings, 0);
  let finished = false;
  let winner: TeamSide | null = null;
  let trackers: Record<TeamSide, CourtTracker | null> = { home: null, away: null };

  // Último evento que dio un punto (para detectar espejos), con su info.
  let lastPoint: { event: ActionEvent; info: EventInfo } | null = null;
  // true si hubo acciones desde el último punto (el rally está en juego).
  let rallyOpen = false;

  const snapshot = (): Courts => {
    const one = (side: TeamSide): CourtSnapshot | null => {
      const t = trackers[side];
      if (!t) return null;
      return { positions: [...t.positions], label: rotationLabel(t.positions, match[side].players, t.rotationsSinceLineup) };
    };
    return { home: one('home'), away: one('away') };
  };

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
    const courts = snapshot();
    const base = { setIndex, mirrorOf: null, servingTeam, courts, afterEnd: finished };
    const score = () => ({ home: current.home, away: current.away });

    if (finished) {
      info[event.id] = { ...base, pointTo: null, scoreAfter: score(), warnings: [] };
      continue;
    }

    const warnings: RallyWarning[] = [];
    const players = match[event.team].players;
    const tracker = trackers[event.team];

    // ---- Eventos que no son parte del rally ----
    if (event.type === 'lineup') {
      trackers[event.team] = { positions: [...event.positions], rotationsSinceLineup: 0 };
      info[event.id] = { ...base, courts: snapshot(), pointTo: null, scoreAfter: score(), warnings };
      continue;
    }
    if (event.type === 'timeout') {
      current.timeouts[event.team] += 1;
      if (current.timeouts[event.team] > TIMEOUTS_PER_SET) warnings.push('timeout-limit');
      info[event.id] = { ...base, pointTo: null, scoreAfter: score(), warnings };
      continue;
    }
    if (event.type === 'substitution') {
      if (isLibero(players, event.playerOut) || isLibero(players, event.playerIn)) {
        // Las entradas del líbero no son cambios: no cuentan ni mueven la formación.
        warnings.push('libero-substitution');
      } else {
        current.substitutions[event.team] += 1;
        if (current.substitutions[event.team] > SUBSTITUTIONS_PER_SET) warnings.push('substitution-limit');
        if (tracker) {
          const idx = tracker.positions.indexOf(event.playerOut);
          if (tracker.positions.includes(event.playerIn)) warnings.push('sub-already-on-court');
          if (idx < 0) warnings.push('sub-not-on-court');
          else tracker.positions[idx] = event.playerIn;
        }
      }
      info[event.id] = { ...base, courts: snapshot(), pointTo: null, scoreAfter: score(), warnings };
      continue;
    }
    if (event.type === 'serve') {
      serving = event.team;
      rallyOpen = false;
      lastPoint = null;
      info[event.id] = { ...base, pointTo: null, scoreAfter: score(), warnings };
      continue;
    }

    // ---- Avisos de lógica del rally ----
    if (event.type === 'action') {
      const n = event.playerNumber;
      if (event.skill === 'S') {
        if (event.team !== servingTeam) warnings.push('serve-wrong-team');
        else if (tracker && tracker.positions[0] !== n) warnings.push('wrong-server');
        if (rallyOpen) warnings.push('rally-not-closed');
      }
      if (event.skill === 'R' && event.team === servingTeam) warnings.push('reception-by-server');
      if (tracker && !tracker.positions.includes(n) && !isLibero(players, n)) warnings.push('player-not-on-court');
    }

    // ---- Punto ----
    if (pointTo) {
      current[pointTo] += 1;
      // Side-out: el que recibía gana el punto, recupera el saque y rota.
      const winnerTracker = trackers[pointTo];
      if (pointTo !== servingTeam && winnerTracker) {
        winnerTracker.positions = rotate(winnerTracker.positions);
        winnerTracker.rotationsSinceLineup += 1;
      }
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
          trackers = { home: null, away: null }; // cada set empieza con formación nueva
        }
      }
    }
  }

  return {
    sets,
    currentSetIndex: sets.length - 1,
    setsWon,
    serving,
    courts: snapshot(),
    finished,
    winner,
    info,
  };
}

/** true si en el set actual ya hubo juego (acciones, puntos o elección de saque). */
export function setHasPlay(match: Match, state: MatchState): boolean {
  return match.events.some(
    (e) =>
      (e.type === 'action' || e.type === 'point' || e.type === 'serve') &&
      state.info[e.id]?.setIndex === state.currentSetIndex,
  );
}

/**
 * true si hay que preguntar quién saca: es el set decisivo y todavía no hubo
 * juego en él (cargar formaciones, tiempos o cambios no cuenta).
 */
export function needsTiebreakServeChoice(match: Match, state: MatchState): boolean {
  return !state.finished && isTiebreak(match.settings, state.currentSetIndex) && !setHasPlay(match, state);
}
