import { describe, expect, it } from 'vitest';
import { computeMatchState } from './match-state';
import { buildRallies, firstAttackAfterReception } from './rallies';
import {
  computeAttackPhases,
  computeErrorBreakdown,
  computeSetSummaries,
  computeSideOutByReception,
} from './report';
import { computeTeamStats } from './stats';
import { makeMatch, times, withCodes, withEvents } from './test-helpers';

// En todos los ejemplos saca primero el local. Visita tiene 1-6 y 12.
const start = () => makeMatch({ firstServe: 'home' });

describe('rallies', () => {
  it('agrupa las acciones hasta el punto, y pega los espejos al rally anterior', () => {
    const m = withCodes(start(), ['1S+', 'a2R+', 'a3E+', 'a4A#', 'a1S#', '3R=', 'T']);
    const rallies = buildRallies(m, computeMatchState(m));
    expect(rallies).toHaveLength(2);
    expect(rallies[0]!.actions.map((a) => a.skill)).toEqual(['S', 'R', 'E', 'A']);
    expect(rallies[1]!.actions.map((a) => a.skill)).toEqual(['S', 'R']); // R= espejo del ace
  });

  it('el primer ataque tras recibir es K1; si el rival toca antes, ya no', () => {
    const m = withCodes(start(), ['1S+', 'a2R+', 'a4A+', '3D+', '4A-', 'a5D+', 'a4A#']);
    const [rally] = buildRallies(m, computeMatchState(m));
    expect(firstAttackAfterReception(rally!)?.quality).toBe('+');
  });
});

describe('ataque por fase', () => {
  it('separa ataque después de recepción y contraataque', () => {
    const m = withCodes(start(), [
      // Rally 1: el visitante recibe bien, ataca (K1), el local defiende y contraataca con punto
      '1S+', 'a2R#', 'a4A+', '3D+', '4A#',
      // Rally 2: el local saca otra vez; el visitante recibe mal y ataca con error (K1)
      '1S+', 'a2R-', 'a4A=',
    ]);
    const state = computeMatchState(m);
    const away = computeAttackPhases(m, state, 'away');
    expect(away.afterReception.total).toBe(2);
    expect(away.afterPositiveReception.total).toBe(1);
    expect(away.afterNegativeReception.counts['=']).toBe(1);
    expect(away.transition.total).toBe(0);
    const home = computeAttackPhases(m, state, 'home');
    expect(home.afterReception.total).toBe(0); // el local sacaba: todo es contraataque
    expect(home.transition.counts['#']).toBe(1);
  });
});

describe('side-out según la recepción', () => {
  it('agrupa los rallies que recibe el equipo por calidad de recepción', () => {
    const m = withCodes(start(), [
      '1S+', 'a2R#', 'a4A#', // visitante recibe # y gana
      'a1S+', '2R+', '4A=', // local recibe + y pierde
      'a1S+', '2R+', '4A#', // local recibe + y gana
    ]);
    const state = computeMatchState(m);
    expect(computeSideOutByReception(m, state, 'away')).toEqual([{ quality: '#', rallies: 1, won: 1 }]);
    expect(computeSideOutByReception(m, state, 'home')).toEqual([{ quality: '+', rallies: 2, won: 1 }]);
  });

  it('cuenta aparte los rallies sin recepción cargada', () => {
    const m = withCodes(start(), ['a4A#']);
    expect(computeSideOutByReception(m, computeMatchState(m), 'away')).toEqual([
      { quality: null, rallies: 1, won: 1 },
    ]);
  });
});

describe('puntos regalados', () => {
  it('suma los errores por tipo y los puntos manuales del rival', () => {
    const m = withCodes(start(), ['1S=', 'a1S+', '2R=', 'a4A+', '3B/', '7A/', 'ap', 'a1S+', '2R+', '4A=']);
    const e = computeErrorBreakdown(m, computeMatchState(m), 'home');
    expect(e).toMatchObject({ serve: 1, reception: 1, block: 1, blocked: 1, attack: 1, other: 1, total: 6 });
  });
});

describe('columnas de Data Volley por jugador', () => {
  it('BP = puntos propios mientras el equipo sacaba; V-P = puntos − errores', () => {
    const m = withCodes(start(), [
      '5S#', // ace del 5 (sacando): BP
      '5S+', 'a2R+', 'a4A+', '3D+', '4A#', // punto del 4 sacando: BP
      '5S=', // error de saque: el visitante recupera el saque
      'a1S+', '2R+', '4A#', // punto del 4 recibiendo: no es BP
      '4S=', // error del 4
    ]);
    const home = computeTeamStats(m, computeMatchState(m), 'home');
    const p4 = home.players.find((p) => p.playerNumber === 4)!;
    expect(p4.points).toBe(2);
    expect(p4.breakPointPoints).toBe(1);
    expect(p4.errors).toBe(1);
    expect(home.totals.breakPointPoints).toBe(2);
  });

  it('un error de recepción que es espejo de un ace sigue contando como error del receptor', () => {
    const m = withCodes(start(), ['1S#', 'a2R=']);
    const away = computeTeamStats(m, computeMatchState(m), 'away');
    expect(away.players.find((p) => p.playerNumber === 2)!.errors).toBe(1);
  });

  it('sets jugados: por formación, por cambio o por tener alguna acción', () => {
    let m = withEvents(start(), [{ kind: 'lineup', team: 'home', positions: [1, 2, 3, 4, 5, 6] }]);
    m = withCodes(m, [...times('p', 25), 'c3:7', '1S+']);
    const home = computeTeamStats(m, computeMatchState(m), 'home');
    const sets = (n: number) => home.players.find((p) => p.playerNumber === n)!.sets;
    expect(sets(2)).toEqual([0]); // solo en la formación del set 1
    expect(sets(7)).toEqual([1]); // entró en el set 2
    expect(sets(1)).toEqual([0, 1]); // formación del set 1 y sacó en el set 2
  });
});

describe('punto de bloqueo cargado después del ataque bloqueado', () => {
  it('"4A/ a10B#": el punto es del bloqueador, no un error del rival', () => {
    const m = withCodes(start(), ['1S+', 'a2R+', 'a4A+', '3D+', '4A/', 'a5B#']);
    const state = computeMatchState(m);
    const away = computeTeamStats(m, state, 'away');
    const blocker = away.players.find((p) => p.playerNumber === 5)!;
    expect(state.sets[0]).toMatchObject({ home: 0, away: 1 }); // un solo punto
    expect(blocker.points).toBe(1);
    expect(away.totals.points).toBe(1);
    expect(away.pointsFromOpponent).toBe(0);
    // El atacante sigue teniendo su ataque bloqueado como error
    const home = computeTeamStats(m, state, 'home');
    expect(home.players.find((p) => p.playerNumber === 4)!.errors).toBe(1);
  });

  it('en el orden inverso ("a5B# 4A/") también es del bloqueador', () => {
    const m = withCodes(start(), ['1S+', 'a2R+', 'a4A+', '3D+', 'a5B#', '4A/']);
    const away = computeTeamStats(m, computeMatchState(m), 'away');
    expect(away.players.find((p) => p.playerNumber === 5)!.points).toBe(1);
    expect(away.pointsFromOpponent).toBe(0);
  });
});

describe('resumen por set', () => {
  it('da el marcador y de dónde salieron los puntos en cada set', () => {
    const m = withCodes(start(), ['1S#', '4A#', '5B#', 'a1S=', ...times('p', 21), 'a4A#']);
    const [s1, s2] = computeSetSummaries(m, computeMatchState(m), 'home');
    expect(s1).toMatchObject({ own: 25, opponent: 0, aces: 1, attackPoints: 1, blockPoints: 1, opponentErrors: 22 });
    expect(s2).toMatchObject({ own: 0, opponent: 1 });
  });
});
