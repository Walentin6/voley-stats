/**
 * Estadísticas por jugador y por equipo, calculadas a partir de los eventos.
 * Las fórmulas están explicadas en docs/06-estadisticas.md.
 */
import type { MatchState } from './match-state';
import { pointOutcome, QUALITIES, SKILLS } from './skills';
import type { Match, Quality, Skill, TeamSide } from './types';
import { otherSide } from './types';

export type QualityCounts = Record<Quality, number>;

export interface SkillStats {
  total: number;
  counts: QualityCounts;
}

export interface StatLine {
  /** Puntos ganados con acciones propias (ace + ataque punto + bloqueo punto). */
  points: number;
  /** De esos puntos, los ganados mientras el equipo sacaba (BP en Data Volley). */
  breakPointPoints: number;
  /** Errores que le dieron el punto al rival (todos los "=", ataque bloqueado e invasión). */
  errors: number;
  skills: Record<Skill, SkillStats>;
}

export interface PlayerStats extends StatLine {
  playerNumber: number;
  name: string;
  /** Sets en los que jugó (índices, 0 = primer set): formación, cambio o alguna acción. */
  sets: number[];
}

/** Rallies de un equipo en una rotación (P1..P6 o R1..R6). */
export interface RotationStats {
  label: string;
  receiveRallies: number;
  sideOuts: number;
  serveRallies: number;
  breakPoints: number;
}

export interface TeamStats {
  players: PlayerStats[];
  /** Solo incluye rallies en los que el equipo tenía formación cargada. */
  rotations: RotationStats[];
  totals: StatLine;
  /** Puntos totales ganados por el equipo. */
  pointsWon: number;
  /** Puntos ganados por errores del rival o asignados a mano. */
  pointsFromOpponent: number;
  /** Puntos asignados a mano a este equipo (sin acción registrada). */
  manualPoints: number;
  /** Rallies jugados recibiendo, y cuántos de ellos ganó el equipo (side-out). */
  receiveRallies: number;
  sideOuts: number;
  /** Rallies jugados sacando, y cuántos de ellos ganó el equipo (break-point). */
  serveRallies: number;
  breakPoints: number;
}

/** 'all' = todo el partido; un número = solo ese set (0 = primer set). */
export type SetFilter = 'all' | number;

export function emptySkillStats(): SkillStats {
  const counts = {} as QualityCounts;
  for (const q of QUALITIES) counts[q] = 0;
  return { total: 0, counts };
}

function emptyStatLine(): StatLine {
  const skills = {} as Record<Skill, SkillStats>;
  for (const s of SKILLS) skills[s] = emptySkillStats();
  return { points: 0, breakPointPoints: 0, errors: 0, skills };
}

/** Suma una acción a unos conteos. */
export function addToSkill(s: SkillStats, quality: Quality): void {
  s.total += 1;
  s.counts[quality] += 1;
}

/**
 * Side-out y break-point de un equipo en cada rotación. La rotación de cada
 * rally es la que tenía el equipo cuando se jugó (antes de rotar por ese punto).
 */
export function computeRotationStats(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): RotationStats[] {
  const byLabel = new Map<string, RotationStats>();
  for (const event of match.events) {
    const info = state.info[event.id];
    if (!info || info.afterEnd || !info.pointTo) continue;
    if (setFilter !== 'all' && info.setIndex !== setFilter) continue;
    const court = info.courts[side];
    if (!court) continue;
    let row = byLabel.get(court.label);
    if (!row) {
      row = { label: court.label, receiveRallies: 0, sideOuts: 0, serveRallies: 0, breakPoints: 0 };
      byLabel.set(court.label, row);
    }
    const won = info.pointTo === side;
    if (info.servingTeam === side) {
      row.serveRallies += 1;
      if (won) row.breakPoints += 1;
    } else {
      row.receiveRallies += 1;
      if (won) row.sideOuts += 1;
    }
  }
  return [...byLabel.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function computeTeamStats(
  match: Match,
  state: MatchState,
  side: TeamSide,
  setFilter: SetFilter = 'all',
): TeamStats {
  const roster = match[side].players;
  const byNumber = new Map<number, PlayerStats>();
  const getPlayer = (n: number): PlayerStats => {
    let player = byNumber.get(n);
    if (!player) {
      // Número que no está en la plantilla: lo mostramos igual para no perder datos.
      player = { playerNumber: n, name: '(sin plantilla)', sets: [], ...emptyStatLine() };
      byNumber.set(n, player);
    }
    return player;
  };
  for (const p of [...roster].sort((a, b) => a.number - b.number)) {
    byNumber.set(p.number, { playerNumber: p.number, name: p.name, sets: [], ...emptyStatLine() });
  }
  const markPlayed = (n: number, setIndex: number) => {
    const sets = getPlayer(n).sets;
    if (!sets.includes(setIndex)) sets.push(setIndex);
  };

  const totals = emptyStatLine();
  let pointsWon = 0;
  let pointsFromOpponent = 0;
  let manualPoints = 0;
  let receiveRallies = 0;
  let sideOuts = 0;
  let serveRallies = 0;
  let breakPoints = 0;

  for (const event of match.events) {
    const info = state.info[event.id];
    if (!info || info.afterEnd) continue;
    if (setFilter !== 'all' && info.setIndex !== setFilter) continue;

    if (info.pointTo === side) {
      pointsWon += 1;
      if (event.type === 'point') manualPoints += 1;
      // Un error del rival cuyo punto se acredita a una acción propia (ace por recepción
      // fallada, o bloqueo después de "A/") no es "error del rival".
      const fromOpponent = event.type === 'point' || (event.team === otherSide(side) && !info.creditedTo);
      if (fromOpponent) pointsFromOpponent += 1;
    }

    // Cada evento que da un punto cierra un rally.
    if (info.pointTo) {
      const won = info.pointTo === side;
      if (info.servingTeam === side) {
        serveRallies += 1;
        if (won) breakPoints += 1;
      } else {
        receiveRallies += 1;
        if (won) sideOuts += 1;
      }
    }

    if (event.team !== side) continue;

    // Quién jugó cada set
    if (event.type === 'lineup') event.positions.forEach((n) => markPlayed(n, info.setIndex));
    if (event.type === 'substitution') markPlayed(event.playerIn, info.setIndex);
    if (event.type !== 'action') continue;
    markPlayed(event.playerNumber, info.setIndex);

    const player = getPlayer(event.playerNumber);
    // Saque seguido de un error de recepción del rival: cuenta como ace (como en Data Volley).
    const quality = info.impliedAce ? '#' : event.quality;
    // El punto es de esta acción si cambió el marcador a favor del equipo (y no se
    // acreditó a otra), o si se le acreditó a ella (ace por recepción fallada, bloqueo).
    const scored = (info.pointTo === side && !info.mirrorOf && !info.creditedTo) || info.creditsPoint === true;
    // Error que da punto al rival (se cuenta aunque sea el espejo de un punto ya contado).
    const isError = pointOutcome(event.skill, event.quality) === 'opponent';

    for (const line of [player, totals]) {
      addToSkill(line.skills[event.skill], quality);
      if (scored) {
        line.points += 1;
        if (info.servingTeam === side) line.breakPointPoints += 1;
      }
      if (isError) line.errors += 1;
    }
  }

  for (const p of byNumber.values()) p.sets.sort((a, b) => a - b);

  return {
    players: [...byNumber.values()],
    rotations: computeRotationStats(match, state, side, setFilter),
    totals,
    pointsWon,
    pointsFromOpponent,
    manualPoints,
    receiveRallies,
    sideOuts,
    serveRallies,
    breakPoints,
  };
}
