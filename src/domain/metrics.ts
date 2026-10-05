/**
 * Indicadores (porcentajes) calculados a partir de los conteos de stats.ts.
 * Todas devuelven un número entre -1 y 1, o null si no hubo acciones.
 * Fórmulas explicadas en docs/06-estadisticas.md.
 */
import type { SkillStats, TeamStats } from './stats';

function ratio(value: number, total: number): number | null {
  return total === 0 ? null : value / total;
}

/** Saque: eficacia = (aces − errores) / total. */
export function serveEfficiency(s: SkillStats): number | null {
  return ratio(s.counts['#'] - s.counts['='], s.total);
}

/** Recepción: positiva = (perfectas + buenas) / total. */
export function receptionPositive(s: SkillStats): number | null {
  return ratio(s.counts['#'] + s.counts['+'], s.total);
}

/** Recepción: perfecta = perfectas / total. */
export function receptionPerfect(s: SkillStats): number | null {
  return ratio(s.counts['#'], s.total);
}

/** Ataque: % de puntos = puntos / total. */
export function attackKill(s: SkillStats): number | null {
  return ratio(s.counts['#'], s.total);
}

/** Ataque: eficacia = (puntos − errores − bloqueados) / total. */
export function attackEfficiency(s: SkillStats): number | null {
  return ratio(s.counts['#'] - s.counts['='] - s.counts['/'], s.total);
}

/** Side-out: % de rallies ganados cuando el equipo recibe (de un equipo o de una rotación). */
export function sideOutPct(stats: Pick<TeamStats, 'sideOuts' | 'receiveRallies'>): number | null {
  return ratio(stats.sideOuts, stats.receiveRallies);
}

/** Break-point: % de rallies ganados cuando el equipo saca (de un equipo o de una rotación). */
export function breakPointPct(stats: Pick<TeamStats, 'breakPoints' | 'serveRallies'>): number | null {
  return ratio(stats.breakPoints, stats.serveRallies);
}

/** Formatea un indicador como porcentaje entero ("45%") o "–" si no hay datos. */
export function formatPct(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)}%`;
}
