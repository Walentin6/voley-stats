/**
 * Catálogo de fundamentos y calidades, y reglas de qué acciones terminan un
 * rally. Ver docs/04-reglas-de-juego.md.
 */
import type { ActionEvent, Position, Quality, Skill } from './types';

/** Orden en que se muestran los fundamentos en la interfaz. */
export const SKILLS: readonly Skill[] = ['S', 'R', 'E', 'A', 'B', 'D', 'F'];

/** Orden en que se muestran las calidades (de mejor a peor). */
export const QUALITIES: readonly Quality[] = ['#', '+', '!', '-', '/', '='];

export const SKILL_LABELS: Record<Skill, string> = {
  S: 'Saque',
  R: 'Recepción',
  E: 'Armado',
  A: 'Ataque',
  B: 'Bloqueo',
  D: 'Defensa',
  F: 'Free ball',
};

/** Significado de cada calidad según el fundamento. */
export const QUALITY_LABELS: Record<Skill, Record<Quality, string>> = {
  S: { '#': 'Ace', '+': 'Bueno', '!': 'Regular', '-': 'Malo', '/': 'Rival devuelve', '=': 'Error' },
  R: { '#': 'Perfecta', '+': 'Buena', '!': 'Regular', '-': 'Mala', '/': 'Devuelve', '=': 'Error' },
  E: { '#': 'Perfecto', '+': 'Bueno', '!': 'Regular', '-': 'Malo', '/': 'Muy malo', '=': 'Error' },
  A: { '#': 'Punto', '+': 'Bueno', '!': 'Regular', '-': 'Malo', '/': 'Bloqueado', '=': 'Error' },
  B: { '#': 'Punto', '+': 'Bueno', '!': 'Regular', '-': 'Malo', '/': 'Invasión', '=': 'Error' },
  D: { '#': 'Perfecta', '+': 'Buena', '!': 'Regular', '-': 'Mala', '/': 'Devuelve', '=': 'Error' },
  F: { '#': 'Perfecta', '+': 'Buena', '!': 'Regular', '-': 'Mala', '/': 'Devuelve', '=': 'Error' },
};

export const POSITION_LABELS: Record<Position, string> = {
  S: 'Armador',
  OH: 'Punta',
  MB: 'Central',
  OP: 'Opuesto',
  L: 'Líbero',
};

/**
 * ¿Quién gana el punto con esta acción?
 * - 'self': el equipo que hizo la acción.
 * - 'opponent': el rival.
 * - null: la acción no termina el rally.
 */
export function pointOutcome(skill: Skill, quality: Quality): 'self' | 'opponent' | null {
  if (quality === '=') return 'opponent';
  if (quality === '#' && (skill === 'S' || skill === 'A' || skill === 'B')) return 'self';
  if (quality === '/' && (skill === 'A' || skill === 'B')) return 'opponent';
  return null;
}

/**
 * Pares "espejo": dos acciones de equipos distintos que describen EL MISMO
 * punto (por ejemplo, un ace S# y la recepción fallada R= del rival).
 * Si se registran las dos seguidas, el punto se cuenta una sola vez.
 */
const MIRROR_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['S#', 'R='], // ace ↔ error de recepción
  ['A#', 'D='], // ataque punto ↔ defensa fallada
  ['A#', 'B='], // ataque punto ↔ bloqueo fallado (bloqueo-out)
  ['A/', 'B#'], // ataque bloqueado ↔ bloqueo punto
];

export function isMirrorPair(a: ActionEvent, b: ActionEvent): boolean {
  if (a.team === b.team) return false;
  const ca = a.skill + a.quality;
  const cb = b.skill + b.quality;
  return MIRROR_PAIRS.some(([x, y]) => (ca === x && cb === y) || (ca === y && cb === x));
}
