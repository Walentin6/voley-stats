/**
 * Estadísticas por jugador y por equipo, calculadas a partir de los eventos.
 * Las fórmulas están explicadas en docs/06-estadisticas.md.
 */
import type { MatchState } from './match-state';
import { QUALITIES, SKILLS } from './skills';
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
  skills: Record<Skill, SkillStats>;
}

export interface PlayerStats extends StatLine {
  playerNumber: number;
  name: string;
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
  /** Rallies jugados recibiendo, y cuántos de ellos ganó el equipo (side-out). */
  receiveRallies: number;
  sideOuts: number;
  /** Rallies jugados sacando, y cuántos de ellos ganó el equipo (break-point). */
  serveRallies: number;
  breakPoints: number;
}

/** 'all' = todo el partido; un número = solo ese set (0 = primer set). */
export type SetFilter = 'all' | number;

function emptyStatLine(): StatLine {
  const skills = {} as Record<Skill, SkillStats>;
  for (const s of SKILLS) {
    const counts = {} as QualityCounts;
    for (const q of QUALITIES) counts[q] = 0;
    skills[s] = { total: 0, counts };
  }
  return { points: 0, skills };
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
  for (const p of [...roster].sort((a, b) => a.number - b.number)) {
    byNumber.set(p.number, { playerNumber: p.number, name: p.name, ...emptyStatLine() });
  }
  const totals = emptyStatLine();
  let pointsWon = 0;
  let pointsFromOpponent = 0;
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
      // Un R= que convierte el saque en ace es punto de saque, no "error del rival".
      const fromOpponent = event.type === 'point' || (event.team === otherSide(side) && !info.aceOf);
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

    if (event.type !== 'action' || event.team !== side) continue;

    let player = byNumber.get(event.playerNumber);
    if (!player) {
      // Número que no está en la plantilla: lo mostramos igual para no perder datos.
      player = { playerNumber: event.playerNumber, name: '(sin plantilla)', ...emptyStatLine() };
      byNumber.set(event.playerNumber, player);
    }

    // Saque seguido de un error de recepción del rival: cuenta como ace (como en Data Volley).
    const quality = info.impliedAce ? '#' : event.quality;
    for (const line of [player, totals]) {
      const s = line.skills[event.skill];
      s.total += 1;
      s.counts[quality] += 1;
      // Un espejo no suma: el punto ya lo tiene la otra acción.
      if ((info.pointTo === side && !info.mirrorOf) || info.impliedAce) line.points += 1;
    }
  }

  return {
    players: [...byNumber.values()],
    rotations: computeRotationStats(match, state, side, setFilter),
    totals,
    pointsWon,
    pointsFromOpponent,
    receiveRallies,
    sideOuts,
    serveRallies,
    breakPoints,
  };
}
