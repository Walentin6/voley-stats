import { describe, expect, it } from 'vitest';
import { parseLine } from './code-parser';
import { computeMatchState } from './match-state';
import { lastLineup, rotate, rotationLabel, validateLineup } from './rotation';
import { computeRotationStats } from './stats';
import { makeMatch, times, withCodes, withEvents } from './test-helpers';
import type { Match, Player } from './types';

/** Partido con roles: en el local el 1 es armador y el 7 líbero. */
function matchWithRoles(firstServe: 'home' | 'away' = 'home'): Match {
  const m = makeMatch({ firstServe });
  const roles: Record<number, Player['position']> = { 1: 'S', 7: 'L' };
  return {
    ...m,
    home: { ...m.home, players: m.home.players.map((p) => ({ ...p, position: roles[p.number] })) },
  };
}

const HOME_LINEUP = [1, 2, 3, 4, 5, 6]; // P1=1 (armador) ... P6=6
const AWAY_LINEUP = [1, 2, 3, 4, 5, 6];

function withLineups(m: Match): Match {
  return withEvents(m, [
    { kind: 'lineup', team: 'home', positions: HOME_LINEUP },
    { kind: 'lineup', team: 'away', positions: AWAY_LINEUP },
  ]);
}

describe('rotate', () => {
  it('rota en sentido horario: el de P2 pasa a P1 y el de P1 a P6', () => {
    expect(rotate([1, 2, 3, 4, 5, 6])).toEqual([2, 3, 4, 5, 6, 1]);
  });

  it('después de 6 rotaciones vuelve al principio', () => {
    let l = [1, 2, 3, 4, 5, 6];
    for (let i = 0; i < 6; i++) l = rotate(l);
    expect(l).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('rotationLabel', () => {
  const players: Player[] = [{ id: 'a', number: 9, name: '', position: 'S' }];

  it('usa la posición del armador', () => {
    expect(rotationLabel([1, 2, 3, 9, 5, 6], players, 0)).toBe('P4');
  });

  it('sin armador, cuenta las rotaciones', () => {
    expect(rotationLabel([1, 2, 3, 4, 5, 6], [], 0)).toBe('R1');
    expect(rotationLabel([1, 2, 3, 4, 5, 6], [], 7)).toBe('R2');
  });
});

describe('validateLineup', () => {
  const m = matchWithRoles();
  it('acepta 6 jugadores distintos de la plantilla', () => {
    expect(validateLineup(m, 'home', HOME_LINEUP)).toBeNull();
  });
  it('rechaza repetidos, números desconocidos y el líbero', () => {
    expect(validateLineup(m, 'home', [1, 1, 3, 4, 5, 6])).toContain('repetido');
    expect(validateLineup(m, 'home', [1, 2, 3, 4, 5, 99])).toContain('99');
    expect(validateLineup(m, 'home', [1, 2, 3, 4, 5, 7])).toContain('líbero');
    expect(validateLineup(m, 'home', [1, 2, 3])).toContain('6');
  });
});

describe('rotaciones en el partido', () => {
  it('sin formación, no hay rotación', () => {
    const s = computeMatchState(makeMatch());
    expect(s.courts).toEqual({ home: null, away: null });
  });

  it('el equipo rota solo cuando recupera el saque', () => {
    // Saca el local. Gana el local (break-point): no rota nadie.
    // Después gana el visitante (side-out): rota el visitante.
    const m = withCodes(withLineups(matchWithRoles('home')), ['1S#', 'a4A#']);
    const s = computeMatchState(m);
    expect(s.courts.home!.positions).toEqual(HOME_LINEUP);
    expect(s.courts.away!.positions).toEqual([2, 3, 4, 5, 6, 1]);
    // El local recupera el saque y rota
    const s2 = computeMatchState(withCodes(m, ['4A#']));
    expect(s2.courts.home!.positions).toEqual([2, 3, 4, 5, 6, 1]);
    expect(s2.courts.home!.label).toBe('P6'); // el armador (1) quedó en P6
  });

  it('cada set empieza sin formación', () => {
    const m = withCodes(withLineups(makeMatch()), times('p', 25));
    expect(computeMatchState(m).courts).toEqual({ home: null, away: null });
  });

  it('un cambio pone al que entra en la posición del que sale', () => {
    const m = withCodes(withLineups(makeMatch()), ['c3:7']);
    expect(computeMatchState(m).courts.home!.positions).toEqual([1, 2, 7, 4, 5, 6]);
  });

  it('las entradas del líbero no mueven la formación ni cuentan como cambio', () => {
    const m = withCodes(withLineups(matchWithRoles()), ['c5:7']);
    const s = computeMatchState(m);
    expect(s.courts.home!.positions).toEqual(HOME_LINEUP);
    expect(s.sets[0]!.substitutions.home).toBe(0);
    expect(s.info[m.events.at(-1)!.id]!.warnings).toEqual(['libero-substitution']);
  });

  it('avisa si el sacador no está en P1 o si actúa alguien que no está en cancha', () => {
    const m = withCodes(withLineups(matchWithRoles('home')), ['2S+', 'a3R+', '7D+', 'a5A-', '6A+']);
    const s = computeMatchState(m);
    const w = m.events.slice(2).map((e) => s.info[e.id]!.warnings);
    expect(w[0]).toContain('wrong-server');
    expect(w[2]).toEqual([]); // el 7 es líbero: puede estar aunque no figure en la formación
    // 6A+ es válido (el 6 está en P6)
    expect(w[4]).toEqual([]);
    const m2 = withCodes(withLineups(matchWithRoles('home')), ['1S+', 'a3R+', 'a12A#']);
    const s2 = computeMatchState(m2);
    expect(s2.info[m2.events.at(-1)!.id]!.warnings).toContain('player-not-on-court');
  });

  it('avisa en cambios imposibles', () => {
    const m = withCodes(withLineups(makeMatch()), ['c7:1', 'c3:2']);
    const s = computeMatchState(m);
    expect(s.info[m.events.at(-2)!.id]!.warnings).toContain('sub-not-on-court');
    expect(s.info[m.events.at(-1)!.id]!.warnings).toContain('sub-already-on-court');
  });

  it('la formación del set decisivo no evita la pregunta del saque', async () => {
    const { needsTiebreakServeChoice } = await import('./match-state');
    const m = withCodes(makeMatch({ bestOf: 3 }), [...times('p', 25), ...times('ap', 25)]);
    const conFormacion = withLineups(m);
    expect(needsTiebreakServeChoice(conFormacion, computeMatchState(conFormacion))).toBe(true);
  });

  it('lastLineup devuelve la última formación cargada del equipo', () => {
    const m = withLineups(makeMatch());
    expect(lastLineup(m, 'home')).toEqual(HOME_LINEUP);
    expect(lastLineup(makeMatch(), 'home')).toBeNull();
  });
});

describe('saque sin número', () => {
  it('con formación, "S+" es del jugador en P1 del equipo que saca', () => {
    const m = withLineups(makeMatch({ firstServe: 'away' }));
    expect(parseLine(m, 'S+')).toMatchObject({
      ok: true,
      codes: [{ kind: 'action', team: 'away', playerNumber: 1, skill: 'S', quality: '+' }],
    });
  });

  it('después de rotar, saca el nuevo P1', () => {
    const m = withLineups(makeMatch({ firstServe: 'home' }));
    expect(parseLine(m, 'S+ a3R+ a4A# S=')).toMatchObject({
      ok: true,
      codes: [{ team: 'home', playerNumber: 1 }, {}, {}, { team: 'away', playerNumber: 2 }],
    });
  });

  it('sin formación, pide el número', () => {
    expect(parseLine(makeMatch(), 'S+')).toMatchObject({ ok: false, error: expect.stringContaining('número') });
  });
});

describe('estadísticas por rotación', () => {
  it('cuenta side-out y break-point en la rotación de cada rally', () => {
    // Local con armador en P1. Saca el local:
    // 1) gana el local sacando en P1 (break-point)
    // 2) gana el visitante → el local pasa a recibir, sigue en P1
    // 3) gana el local recibiendo en P1 (side-out) → rota a P6
    const m = withCodes(withLineups(matchWithRoles('home')), ['1S#', 'a4A#', '4A#']);
    const rows = computeRotationStats(m, computeMatchState(m), 'home');
    expect(rows).toEqual([{ label: 'P1', serveRallies: 2, breakPoints: 1, receiveRallies: 1, sideOuts: 1 }]);
  });

  it('no cuenta rallies sin formación', () => {
    const m = withCodes(makeMatch(), ['7A#']);
    expect(computeRotationStats(m, computeMatchState(m), 'home')).toEqual([]);
  });
});
