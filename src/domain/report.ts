/**
 * Análisis del partido al estilo del informe de Data Volley:
 * resumen por set, ataque por fase (K1 / contraataque), side-out según la
 * recepción y puntos regalados. Fórmulas en docs/06-estadisticas.md.
 */
import type { MatchState } from './match-state';
import { buildRallies, firstAttackAfterReception, isPositiveReception, receptionOf } from './rallies';
import { QUALITIES } from './skills';
import { addToSkill, computeTeamStats, emptySkillStats, type SetFilter, type SkillStats } from './stats';
import type { Match, Quality, TeamSide } from './types';
import { otherSide } from './types';

// ---------------------------------------------------------------------------
// Resumen por set
// ---------------------------------------------------------------------------

export interface SetSummary {
  setIndex: number;
  /** Puntos del equipo y del rival en el set. */
  own: number;
  opponent: number;
  /** De dónde salieron los puntos del equipo. */
  aces: number;
  attackPoints: number;
  blockPoints: number;
  opponentErrors: number;
  receiveRallies: number;
  sideOuts: number;
  serveRallies: number;
  breakPoints: number;
  /** Minutos entre la primera y la última acción registrada del set (null si no se puede calcular). */
  durationMinutes: number | null;
}

function durationOf(match: Match, state: MatchState, setIndex: number): number | null {
  const times = match.events
    .filter((e) => state.info[e.id]?.setIndex === setIndex && !state.info[e.id]?.afterEnd)
    .map((e) => Date.parse(e.timestamp))
    .filter((t) => !Number.isNaN(t));
  if (times.length < 2) return null;
  return Math.round((Math.max(...times) - Math.min(...times)) / 60000);
}

export function computeSetSummaries(match: Match, state: MatchState, side: TeamSide): SetSummary[] {
  return state.sets.map((set, setIndex) => {
    const st = computeTeamStats(match, state, side, setIndex);
    return {
      setIndex,
      own: set[side],
      opponent: set[otherSide(side)],
      aces: st.totals.skills.S.counts['#'],
      attackPoints: st.totals.skills.A.counts['#'],
      blockPoints: st.totals.skills.B.counts['#'],
      opponentErrors: st.pointsFromOpponent,
      receiveRallies: st.receiveRallies,
      sideOuts: st.sideOuts,
      serveRallies: st.serveRallies,
      breakPoints: st.breakPoints,
      durationMinutes: durationOf(match, state, setIndex),
    };
  });
}

// ---------------------------------------------------------------------------
// Ataque por fase
// ---------------------------------------------------------------------------

export interface AttackPhases {
  /** Ataque después de recepción (K1, side-out): primer ataque tras recibir el saque. */
  afterReception: SkillStats;
  /** K1 después de recepción positiva (# +). */
  afterPositiveReception: SkillStats;
  /** K1 después de recepción negativa (! - /). */
  afterNegativeReception: SkillStats;
  /** Contraataque (K2, transición): todos los demás ataques. */
  transition: SkillStats;
}

export function computeAttackPhases(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): AttackPhases {
  const phases: AttackPhases = {
    afterReception: emptySkillStats(),
    afterPositiveReception: emptySkillStats(),
    afterNegativeReception: emptySkillStats(),
    transition: emptySkillStats(),
  };
  for (const rally of buildRallies(match, state)) {
    if (setFilter !== 'all' && rally.setIndex !== setFilter) continue;
    const k1 = rally.servingTeam !== side ? firstAttackAfterReception(rally) : null;
    const reception = receptionOf(rally);
    for (const a of rally.actions) {
      if (a.team !== side || a.skill !== 'A') continue;
      if (a === k1) {
        addToSkill(phases.afterReception, a.quality);
        if (reception) {
          const group = isPositiveReception(reception.quality)
            ? phases.afterPositiveReception
            : phases.afterNegativeReception;
          addToSkill(group, a.quality);
        }
      } else {
        addToSkill(phases.transition, a.quality);
      }
    }
  }
  return phases;
}

// ---------------------------------------------------------------------------
// Side-out según la calidad de la recepción
// ---------------------------------------------------------------------------

export interface SideOutByReceptionRow {
  /** Calidad de la recepción, o null = no se cargó la recepción. */
  quality: Quality | null;
  rallies: number;
  won: number;
}

export function computeSideOutByReception(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): SideOutByReceptionRow[] {
  const rows = new Map<Quality | null, SideOutByReceptionRow>();
  for (const q of [...QUALITIES, null]) rows.set(q, { quality: q, rallies: 0, won: 0 });
  for (const rally of buildRallies(match, state)) {
    if (setFilter !== 'all' && rally.setIndex !== setFilter) continue;
    if (rally.servingTeam === side) continue; // solo rallies en los que el equipo recibe
    const row = rows.get(receptionOf(rally)?.quality ?? null)!;
    row.rallies += 1;
    if (rally.pointTo === side) row.won += 1;
  }
  return [...rows.values()].filter((r) => r.rallies > 0);
}

// ---------------------------------------------------------------------------
// Puntos regalados (errores que le dieron el punto al rival)
// ---------------------------------------------------------------------------

export interface ErrorBreakdown {
  serve: number; // S=
  reception: number; // R=
  attack: number; // A=
  blocked: number; // A/
  block: number; // B= y B/ (invasión)
  set: number; // E=
  dig: number; // D=
  freeball: number; // F=
  /** Puntos asignados a mano al rival (faltas de rotación, red, toques no registrados...). */
  other: number;
  total: number;
}

export function computeErrorBreakdown(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): ErrorBreakdown {
  const { skills } = computeTeamStats(match, state, side, setFilter).totals;
  const other = computeTeamStats(match, state, otherSide(side), setFilter).manualPoints;
  const breakdown = {
    serve: skills.S.counts['='],
    reception: skills.R.counts['='],
    attack: skills.A.counts['='],
    blocked: skills.A.counts['/'],
    block: skills.B.counts['='] + skills.B.counts['/'],
    set: skills.E.counts['='],
    dig: skills.D.counts['='],
    freeball: skills.F.counts['='],
    other,
  };
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { ...breakdown, total };
}
