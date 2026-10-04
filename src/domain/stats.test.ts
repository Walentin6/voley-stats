import { describe, expect, it } from 'vitest';
import { computeMatchState } from './match-state';
import { attackEfficiency, attackKill, receptionPositive, serveEfficiency } from './metrics';
import { computeTeamStats } from './stats';
import { makeMatch, times, withCodes } from './test-helpers';

describe('computeTeamStats', () => {
  it('cuenta acciones y puntos por jugador', () => {
    const m = withCodes(makeMatch(), ['7A#', '7A=', '7A/', '7A+', '1S#', 'a12A#', 'ap']);
    const stats = computeTeamStats(m, computeMatchState(m), 'home');
    const p7 = stats.players.find((p) => p.playerNumber === 7)!;
    expect(p7.skills.A.total).toBe(4);
    expect(p7.points).toBe(1);
    expect(attackKill(p7.skills.A)).toBe(0.25);
    expect(attackEfficiency(p7.skills.A)).toBe(-0.25);
    expect(stats.totals.points).toBe(2); // 7A# + 1S#
    expect(stats.pointsWon).toBe(2);
  });

  it('cuenta los puntos que regala el rival', () => {
    const m = withCodes(makeMatch(), ['a1S=', 'a12A=', 'p', '7A#']);
    const stats = computeTeamStats(m, computeMatchState(m), 'home');
    expect(stats.pointsWon).toBe(4);
    expect(stats.pointsFromOpponent).toBe(3);
  });

  it('el espejo cuenta la acción pero no el punto', () => {
    const m = withCodes(makeMatch(), ['1S#', 'a2R=']);
    const state = computeMatchState(m);
    const home = computeTeamStats(m, state, 'home');
    const away = computeTeamStats(m, state, 'away');
    expect(home.totals.points).toBe(1);
    expect(home.pointsFromOpponent).toBe(0);
    expect(away.totals.skills.R.counts['=']).toBe(1);
  });

  it('filtra por set', () => {
    const m = withCodes(makeMatch(), [...times('7A#', 25), '7A#', '7A#']);
    const state = computeMatchState(m);
    expect(computeTeamStats(m, state, 'home', 0).totals.skills.A.total).toBe(25);
    expect(computeTeamStats(m, state, 'home', 1).totals.skills.A.total).toBe(2);
  });
});

describe('metrics', () => {
  it('devuelve null si no hay acciones', () => {
    const m = makeMatch();
    const stats = computeTeamStats(m, computeMatchState(m), 'home');
    expect(serveEfficiency(stats.totals.skills.S)).toBeNull();
  });

  it('calcula recepción positiva', () => {
    const m = withCodes(makeMatch(), ['2R#', '2R+', '2R-', '2R=']);
    const stats = computeTeamStats(m, computeMatchState(m), 'home');
    expect(receptionPositive(stats.totals.skills.R)).toBe(0.5);
  });
});
