import { describe, expect, it } from 'vitest';
import { computeMatchState } from './match-state';
import {
  attackEfficiency,
  attackKill,
  breakPointPct,
  receptionPositive,
  serveEfficiency,
  servePositive,
  sideOutPct,
} from './metrics';
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

describe('saque', () => {
  const serveOf = (codes: string[]) => {
    const m = withCodes(makeMatch({ firstServe: 'home' }), codes);
    const state = computeMatchState(m);
    return { m, state, home: computeTeamStats(m, state, 'home'), away: computeTeamStats(m, state, 'away') };
  };

  it('un ace solo da 100% de eficacia', () => {
    const { home } = serveOf(['5S#']);
    expect(serveEfficiency(home.totals.skills.S)).toBe(1);
  });

  it('un saque que entra (sin ace ni error) es neutro: 0%', () => {
    const { home } = serveOf(['5S+']);
    expect(serveEfficiency(home.totals.skills.S)).toBe(0);
  });

  it('saque seguido de error de recepción del rival = ace (como en Data Volley)', () => {
    const { m, state, home } = serveOf(['5S+', 'a2R=']);
    const p5 = home.players.find((p) => p.playerNumber === 5)!;
    expect(p5.skills.S.counts['#']).toBe(1);
    expect(p5.skills.S.counts['+']).toBe(0);
    expect(p5.points).toBe(1);
    expect(serveEfficiency(p5.skills.S)).toBe(1);
    expect(home.pointsFromOpponent).toBe(0); // es punto de saque, no error del rival
    expect(home.pointsWon).toBe(1);
    expect(state.sets[0]).toMatchObject({ home: 1, away: 0 });
    expect(state.info[m.events[0]!.id]!.impliedAce).toBe(true);
  });

  it('el ace por recepción también vale si hay un tiempo muerto en medio', () => {
    const { home } = serveOf(['5S!', 'aT', 'a2R=']);
    expect(home.totals.skills.S.counts['#']).toBe(1);
  });

  it('no es ace si la recepción no fue error', () => {
    const { home } = serveOf(['5S+', 'a2R-']);
    expect(home.totals.skills.S.counts['#']).toBe(0);
  });

  it('S# + R= sigue contando un solo ace y un solo punto', () => {
    const { home, state } = serveOf(['5S#', 'a2R=']);
    expect(home.totals.skills.S.counts['#']).toBe(1);
    expect(home.totals.points).toBe(1);
    expect(state.sets[0]).toMatchObject({ home: 1 });
  });

  it('saque positivo: aces, buenos y "rival devuelve"', () => {
    const { home } = serveOf(['5S#', '5S+', '5S/', '5S!', '5S-', '5S=']);
    // 5S# punto local; los siguientes del mismo jugador: no importa quién saca para esta cuenta
    expect(servePositive(home.totals.skills.S)).toBe(0.5);
  });
});

describe('side-out y break-point', () => {
  it('separa los rallies según quién sacaba', () => {
    // Saca el local: pierde el primer rally (side-out del visitante),
    // saca el visitante: el local gana (side-out local), el local saca y gana (break-point local).
    const m = withCodes(makeMatch({ firstServe: 'home' }), ['a12A#', '7A#', '1S#']);
    const state = computeMatchState(m);
    const home = computeTeamStats(m, state, 'home');
    const away = computeTeamStats(m, state, 'away');
    expect(home).toMatchObject({ serveRallies: 2, breakPoints: 1, receiveRallies: 1, sideOuts: 1 });
    expect(away).toMatchObject({ serveRallies: 1, breakPoints: 0, receiveRallies: 2, sideOuts: 1 });
    expect(sideOutPct(home)).toBe(1);
    expect(breakPointPct(home)).toBe(0.5);
  });

  it('un espejo no cuenta como otro rally', () => {
    const m = withCodes(makeMatch({ firstServe: 'home' }), ['1S#', 'a2R=']);
    const home = computeTeamStats(m, computeMatchState(m), 'home');
    expect(home.serveRallies).toBe(1);
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
