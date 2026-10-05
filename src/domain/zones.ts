/**
 * Zonas de la cancha, como en Data Volley. Cada mitad tiene 9 zonas, numeradas
 * desde el punto de vista de SU equipo, mirando a la red:
 *
 *        RED
 *    4    3    2      ← adelante
 *    7    8    9      ← medio
 *    5    6    1      ← atrás
 *
 * Un saque o un ataque tiene una zona de origen (en la cancha propia) y una
 * zona de destino (en la cancha rival, con la numeración del rival).
 * Ver docs/04-reglas-de-juego.md (sección "Zonas").
 */
import type { Skill } from './types';

export type Zone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const ZONES: readonly Zone[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function isZone(value: unknown): value is Zone {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9;
}

/** Fundamentos en los que la app pide zonas al cargar con la cancha. */
export const ZONED_SKILLS: readonly Skill[] = ['S', 'A'];

/** Nombre corto de cada zona (para tablas). */
export const ZONE_NAMES: Record<Zone, string> = {
  1: 'Zona 1 (zaguero derecho)',
  2: 'Zona 2 (delantero derecho)',
  3: 'Zona 3 (centro)',
  4: 'Zona 4 (delantero izquierdo)',
  5: 'Zona 5 (zaguero izquierdo)',
  6: 'Zona 6 (zaguero centro)',
  7: 'Zona 7 (medio izquierdo)',
  8: 'Zona 8 (medio centro)',
  9: 'Zona 9 (medio derecho)',
};

/** Texto de un recorrido: "4→7", "zona 4", "→7" o "" si no hay zonas. */
export function routeLabel(start?: Zone, end?: Zone): string {
  if (start && end) return `${start}→${end}`;
  if (start) return `zona ${start}`;
  if (end) return `→${end}`;
  return '';
}
