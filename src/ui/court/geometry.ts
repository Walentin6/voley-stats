/**
 * Geometría de la cancha dibujada (SVG). La cancha se dibuja horizontal: una
 * mitad a la izquierda, la red en el medio y la otra mitad a la derecha.
 * 1 unidad = 10 cm: la cancha mide 180 × 90 (18 m × 9 m) y cada zona 30 × 30.
 *
 * Cada mitad numera sus zonas mirando a la red. Así se ven en pantalla:
 *
 *     mitad izquierda        RED       mitad derecha
 *       5   7   4             |          2   9   1
 *       6   8   3             |          3   8   6
 *       1   9   2             |          4   7   5
 */
import type { Zone } from '../../domain/zones';

export type HalfPosition = 'left' | 'right';

export const COURT_LENGTH = 180;
export const COURT_WIDTH = 90;
export const ZONE_SIZE = 30;

/** Zonas de cada columna (de izquierda a derecha en pantalla), cada una de arriba abajo. */
const COLUMNS: Record<HalfPosition, Zone[][]> = {
  left: [
    [5, 6, 1],
    [7, 8, 9],
    [4, 3, 2],
  ],
  right: [
    [2, 3, 4],
    [9, 8, 7],
    [1, 6, 5],
  ],
};

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function zoneRect(half: HalfPosition, zone: Zone): Rect {
  const columns = COLUMNS[half];
  const col = columns.findIndex((c) => c.includes(zone));
  const row = columns[col]!.indexOf(zone);
  const offset = half === 'left' ? 0 : COURT_LENGTH / 2;
  return { x: offset + col * ZONE_SIZE, y: row * ZONE_SIZE, w: ZONE_SIZE, h: ZONE_SIZE };
}

export function zoneCenter(half: HalfPosition, zone: Zone): { x: number; y: number } {
  const r = zoneRect(half, zone);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export function otherHalf(half: HalfPosition): HalfPosition {
  return half === 'left' ? 'right' : 'left';
}
