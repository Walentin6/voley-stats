/**
 * Tipos centrales del dominio. Ver docs/03-modelo-de-datos.md.
 *
 * Idea clave: un partido es una LISTA DE EVENTOS. El marcador, los sets y las
 * estadísticas no se guardan: se calculan recorriendo esa lista
 * (ver match-state.ts y stats.ts).
 */

/** Lado del partido: equipo local o visitante. */
export type TeamSide = 'home' | 'away';

/**
 * Fundamentos (códigos de una letra, compatibles con Data Volley):
 * S = Saque, R = Recepción, E = Armado, A = Ataque, B = Bloqueo, D = Defensa,
 * F = Free ball (recepción de una pelota fácil que manda el rival).
 */
export type Skill = 'S' | 'R' | 'E' | 'A' | 'B' | 'D' | 'F';

/**
 * Calidad de la acción, de mejor a peor:
 * # = perfecta / punto, + = buena, ! = regular, - = mala,
 * / = muy mala (su significado depende del fundamento), = = error.
 */
export type Quality = '#' | '+' | '!' | '-' | '/' | '=';

/** Posición habitual del jugador (opcional). */
export type Position = 'S' | 'OH' | 'MB' | 'OP' | 'L';

export interface Player {
  id: string;
  /** Número de camiseta (0–99). Es único dentro de un equipo. */
  number: number;
  name: string;
  position?: Position;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Copia del equipo tal como estaba al crear el partido. Así, si después se
 * edita la plantilla, los partidos viejos no cambian.
 */
export interface MatchTeam {
  teamId: string;
  name: string;
  players: Player[];
}

export interface MatchSettings {
  /** Al mejor de 3 o de 5 sets. */
  bestOf: 3 | 5;
  /** Puntos para ganar un set normal (habitualmente 25). */
  pointsPerSet: number;
  /** Puntos para ganar el set decisivo (habitualmente 15). */
  pointsTiebreak: number;
  /** Quién saca primero en el set 1. */
  firstServe: TeamSide;
}

/** Acción de un jugador: "el 7 local atacó y fue punto". */
export interface ActionEvent {
  id: string;
  type: 'action';
  team: TeamSide;
  playerNumber: number;
  skill: Skill;
  quality: Quality;
  /** Fecha y hora ISO en la que se registró. */
  timestamp: string;
}

/**
 * Punto asignado a mano, sin acción de jugador: errores del rival que no se
 * registran (red, rotación, toque doble...), sanciones, etc.
 */
export interface PointEvent {
  id: string;
  type: 'point';
  team: TeamSide;
  timestamp: string;
}

/** Tiempo muerto pedido por un equipo. */
export interface TimeoutEvent {
  id: string;
  type: 'timeout';
  team: TeamSide;
  timestamp: string;
}

/** Cambio de jugador (sale playerOut, entra playerIn). */
export interface SubstitutionEvent {
  id: string;
  type: 'substitution';
  team: TeamSide;
  playerOut: number;
  playerIn: number;
  timestamp: string;
}

/**
 * Indica a mano quién saca a partir de ahora. Se usa para elegir el saque del
 * set decisivo (que se sortea) o para corregir un error.
 */
export interface ServeChangeEvent {
  id: string;
  type: 'serve';
  /** Equipo que pasa a tener el saque. */
  team: TeamSide;
  timestamp: string;
}

export type MatchEvent = ActionEvent | PointEvent | TimeoutEvent | SubstitutionEvent | ServeChangeEvent;

export interface Match {
  id: string;
  /** Fecha del partido (AAAA-MM-DD). */
  date: string;
  competition: string;
  home: MatchTeam;
  away: MatchTeam;
  settings: MatchSettings;
  events: MatchEvent[];
  createdAt: string;
  updatedAt: string;
}

export function otherSide(side: TeamSide): TeamSide {
  return side === 'home' ? 'away' : 'home';
}
