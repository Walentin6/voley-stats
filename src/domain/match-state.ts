/**
 * Calcula el estado del partido (marcador, sets, quién saca, ganador)
 * "reproduciendo" la lista de eventos desde el principio.
 *
 * Ventaja: deshacer o borrar cualquier acción es trivial, porque el marcador
 * se recalcula solo. Ver docs/adr/ADR-002-eventos.md.
 */
import { isMirrorPair, pointOutcome } from './skills';
import type { ActionEvent, Match, MatchEvent, MatchSettings, TeamSide } from './types';
import { otherSide } from './types';

export interface Score {
  home: number;
  away: number;
}

export interface SetResult extends Score {
  /** Ganador del set, o null si se está jugando. */
  winner: TeamSide | null;
}

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
 * Quién saca al empezar cada set. Se alterna set a set.
 * (En el set decisivo el reglamento usa un nuevo sorteo; por ahora se alterna
 * igual. Ver "Limitaciones" en docs/04-reglas-de-juego.md.)
 */
export function firstServerOfSet(settings: MatchSettings, setIndex: number): TeamSide {
  return setIndex % 2 === 0 ? settings.firstServe : otherSide(settings.firstServe);
}

/** Calcula quién gana el punto con un evento, sin tener en cuenta espejos. */
function rawPointTo(event: MatchEvent): TeamSide | null {
  if (event.type === 'point') return event.team;
  const outcome = pointOutcome(event.skill, event.quality);
  if (outcome === 'self') return event.team;
  if (outcome === 'opponent') return otherSide(event.team);
  return null;
}

export function computeMatchState(match: Match): MatchState {
  const { settings } = match;
  const sets: SetResult[] = [{ home: 0, away: 0, winner: null }];
  const setsWon: Score = { home: 0, away: 0 };
  const info: Record<string, EventInfo> = {};
  let serving: TeamSide = firstServerOfSet(settings, 0);
  let finished = false;
  let winner: TeamSide | null = null;

  // Último evento que dio un punto (para detectar espejos), con su info.
  let lastPoint: { event: ActionEvent; info: EventInfo } | null = null;

  for (const event of match.events) {
    const setIndex = sets.length - 1;
    const current = sets[setIndex]!;
    const pointTo = rawPointTo(event);

    // ¿Es el "espejo" del punto anterior? Entonces no suma otra vez.
    if (pointTo && event.type === 'action' && lastPoint && isMirrorPair(lastPoint.event, event)) {
      info[event.id] = {
        ...lastPoint.info,
        pointTo: null,
        mirrorOf: lastPoint.event.id,
      };
      lastPoint = null;
      continue;
    }

    if (finished) {
      info[event.id] = {
        setIndex,
        pointTo: null,
        mirrorOf: null,
        servingTeam: serving,
        scoreAfter: { home: current.home, away: current.away },
        afterEnd: true,
      };
      continue;
    }

    const servingTeam = serving;
    if (pointTo) {
      current[pointTo] += 1;
      serving = pointTo; // quien gana el punto, saca
    }

    const eventInfo: EventInfo = {
      setIndex,
      pointTo,
      mirrorOf: null,
      servingTeam,
      scoreAfter: { home: current.home, away: current.away },
      afterEnd: false,
    };
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
          sets.push({ home: 0, away: 0, winner: null });
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
