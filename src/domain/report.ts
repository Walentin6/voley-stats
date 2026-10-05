/**
 * Análisis del partido al estilo del informe de Data Volley:
 * resumen por set, ataque por fase (K1 / contraataque), side-out según la
 * recepción y puntos regalados. Fórmulas en docs/06-estadisticas.md.
 */
import type { MatchState } from './match-state';
import { buildRallies, firstAttackAfterReception, isPositiveReception, receptionOf } from './rallies';
import { pointOutcome, QUALITIES } from './skills';
import { addToSkill, computeTeamStats, emptySkillStats, type SetFilter, type SkillStats } from './stats';
import type { ActionEvent, Match, Quality, TeamSide } from './types';
import { otherSide } from './types';
import type { Zone } from './zones';

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

/**
 * Fase de un ataque:
 * - 'k1-positive' / 'k1-negative': después de recepción positiva / negativa
 * - 'k1': después de recepción, pero la recepción no se cargó
 * - 'k2': contraataque
 */
export type AttackPhase = 'k1-positive' | 'k1-negative' | 'k1' | 'k2';

/** Todos los ataques del equipo con su fase. */
export function classifyAttacks(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): { attack: ActionEvent; phase: AttackPhase }[] {
  const result: { attack: ActionEvent; phase: AttackPhase }[] = [];
  for (const rally of buildRallies(match, state)) {
    if (setFilter !== 'all' && rally.setIndex !== setFilter) continue;
    const k1 = rally.servingTeam !== side ? firstAttackAfterReception(rally) : null;
    const reception = receptionOf(rally);
    for (const a of rally.actions) {
      if (a.team !== side || a.skill !== 'A') continue;
      let phase: AttackPhase = 'k2';
      if (a === k1) phase = !reception ? 'k1' : isPositiveReception(reception.quality) ? 'k1-positive' : 'k1-negative';
      result.push({ attack: a, phase });
    }
  }
  return result;
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
  for (const { attack, phase } of classifyAttacks(match, state, side, setFilter)) {
    if (phase === 'k2') {
      addToSkill(phases.transition, attack.quality);
      continue;
    }
    addToSkill(phases.afterReception, attack.quality);
    if (phase === 'k1-positive') addToSkill(phases.afterPositiveReception, attack.quality);
    if (phase === 'k1-negative') addToSkill(phases.afterNegativeReception, attack.quality);
  }
  return phases;
}

// ---------------------------------------------------------------------------
// Distribución del ataque por zona de origen ("distribución del armador")
// ---------------------------------------------------------------------------

export interface AttackZoneRow {
  /** Zona desde la que se atacó (null = sin zona cargada). */
  zone: Zone | null;
  all: SkillStats;
  k1Positive: SkillStats;
  k1Negative: SkillStats;
  k2: SkillStats;
}

export function computeAttackDistribution(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): AttackZoneRow[] {
  const rows = new Map<Zone | null, AttackZoneRow>();
  for (const { attack, phase } of classifyAttacks(match, state, side, setFilter)) {
    const zone = attack.startZone ?? null;
    let row = rows.get(zone);
    if (!row) {
      row = { zone, all: emptySkillStats(), k1Positive: emptySkillStats(), k1Negative: emptySkillStats(), k2: emptySkillStats() };
      rows.set(zone, row);
    }
    addToSkill(row.all, attack.quality);
    if (phase === 'k1-positive') addToSkill(row.k1Positive, attack.quality);
    if (phase === 'k1-negative') addToSkill(row.k1Negative, attack.quality);
    if (phase === 'k2') addToSkill(row.k2, attack.quality);
  }
  // Orden de Data Volley: delanteros 4, 3, 2, después zagueros y medio; "sin zona" al final.
  const order: (Zone | null)[] = [4, 3, 2, 1, 6, 5, 7, 8, 9, null];
  return [...rows.values()].sort((a, b) => order.indexOf(a.zone) - order.indexOf(b.zone));
}

// ---------------------------------------------------------------------------
// Mapas de dirección (saque y ataque)
// ---------------------------------------------------------------------------

export type RouteOutcome = 'point' | 'error' | 'other';

export interface ZoneRoute {
  start: Zone | null;
  end: Zone;
  outcome: RouteOutcome;
  count: number;
}

export interface ZoneMap {
  /** Recorridos agrupados (origen, destino, resultado). Solo acciones con zona de destino. */
  routes: ZoneRoute[];
  /** Cuántas acciones salieron de cada zona (en la cancha propia). */
  startCounts: Partial<Record<Zone, number>>;
  /** Cuántas acciones terminaron en cada zona (en la cancha rival). */
  endCounts: Partial<Record<Zone, number>>;
  /** Acciones que pasan el filtro, y cuántas tienen alguna zona cargada. */
  total: number;
  withZones: number;
}

export function computeZoneMap(
  match: Match,
  state: MatchState,
  side: TeamSide,
  skill: 'S' | 'A',
  setFilter: SetFilter = 'all',
  playerNumber: number | null = null,
): ZoneMap {
  const routes = new Map<string, ZoneRoute>();
  const startCounts: Partial<Record<Zone, number>> = {};
  const endCounts: Partial<Record<Zone, number>> = {};
  let total = 0;
  let withZones = 0;

  for (const event of match.events) {
    if (event.type !== 'action' || event.team !== side || event.skill !== skill) continue;
    if (playerNumber !== null && event.playerNumber !== playerNumber) continue;
    const info = state.info[event.id];
    if (!info || info.afterEnd) continue;
    if (setFilter !== 'all' && info.setIndex !== setFilter) continue;
    total += 1;
    const { startZone, endZone } = event;
    if (startZone || endZone) withZones += 1;
    if (startZone) startCounts[startZone] = (startCounts[startZone] ?? 0) + 1;
    if (!endZone) continue;
    endCounts[endZone] = (endCounts[endZone] ?? 0) + 1;

    const outcome: RouteOutcome =
      event.quality === '#' || info.impliedAce
        ? 'point'
        : pointOutcome(event.skill, event.quality) === 'opponent'
          ? 'error'
          : 'other';
    const key = `${startZone ?? '-'}:${endZone}:${outcome}`;
    const route = routes.get(key) ?? { start: startZone ?? null, end: endZone, outcome, count: 0 };
    route.count += 1;
    routes.set(key, route);
  }
  return { routes: [...routes.values()], startCounts, endCounts, total, withZones };
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
