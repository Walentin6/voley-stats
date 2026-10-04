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

export interface TeamStats {
  players: PlayerStats[];
  totals: StatLine;
  /** Puntos totales ganados por el equipo. */
  pointsWon: number;
  /** Puntos ganados por errores del rival o asignados a mano. */
  pointsFromOpponent: number;
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

  for (const event of match.events) {
    const info = state.info[event.id];
    if (!info || info.afterEnd) continue;
    if (setFilter !== 'all' && info.setIndex !== setFilter) continue;

    if (info.pointTo === side) {
      pointsWon += 1;
      if (event.type === 'point' || event.team === otherSide(side)) pointsFromOpponent += 1;
    }

    if (event.type !== 'action' || event.team !== side) continue;

    let player = byNumber.get(event.playerNumber);
    if (!player) {
      // Número que no está en la plantilla: lo mostramos igual para no perder datos.
      player = { playerNumber: event.playerNumber, name: '(sin plantilla)', ...emptyStatLine() };
      byNumber.set(event.playerNumber, player);
    }

    for (const line of [player, totals]) {
      const s = line.skills[event.skill];
      s.total += 1;
      s.counts[event.quality] += 1;
      // Un espejo no suma: el punto ya lo tiene la otra acción.
      if (info.pointTo === side && !info.mirrorOf) line.points += 1;
    }
  }

  return { players: [...byNumber.values()], totals, pointsWon, pointsFromOpponent };
}
