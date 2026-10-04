import { describe, expect, it } from 'vitest';
import { computeMatchState, needsTiebreakServeChoice } from './match-state';
import { makeMatch, times, withCodes, withEvents } from './test-helpers';

describe('computeMatchState', () => {
  it('empieza 0-0 en el primer set con el saque elegido', () => {
    const s = computeMatchState(makeMatch({ firstServe: 'away' }));
    expect(s.sets).toMatchObject([{ home: 0, away: 0, winner: null }]);
    expect(s.serving).toBe('away');
    expect(s.finished).toBe(false);
  });

  it('asigna puntos según la acción', () => {
    const m = withCodes(makeMatch(), [
      '7A#', // ataque punto → local
      '1S=', // error de saque local → visitante
      'a12A/', // ataque visitante bloqueado → local
      'a3B=', // error de bloqueo visitante → local
      '2R+', // recepción buena → no termina el rally
      '5F+', // free ball bueno → no termina el rally
      'a6F=', // error en free ball visitante → local
    ]);
    const s = computeMatchState(m);
    expect(s.sets[0]).toMatchObject({ home: 4, away: 1 });
  });

  it('el que gana el punto pasa a sacar', () => {
    const m = withCodes(makeMatch({ firstServe: 'home' }), ['ap']);
    expect(computeMatchState(m).serving).toBe('away');
  });

  it('no cuenta dos veces un punto registrado con su espejo', () => {
    const m = withCodes(makeMatch(), ['1S#', 'a2R=', 'a12A/', '3B#']);
    const s = computeMatchState(m);
    expect(s.sets[0]).toMatchObject({ home: 2, away: 0 });
    const [, mirror] = m.events;
    expect(s.info[mirror!.id]!.mirrorOf).toBe(m.events[0]!.id);
  });

  it('dos aces seguidos del mismo equipo son dos puntos', () => {
    const m = withCodes(makeMatch(), ['1S#', '1S#']);
    expect(computeMatchState(m).sets[0]).toMatchObject({ home: 2, away: 0 });
  });

  it('termina el set a 25 con 2 de diferencia y alterna el saque', () => {
    const m = withCodes(makeMatch({ firstServe: 'home' }), times('p', 25));
    const s = computeMatchState(m);
    expect(s.sets[0]).toMatchObject({ home: 25, away: 0, winner: 'home' });
    expect(s.sets).toHaveLength(2);
    expect(s.serving).toBe('away'); // set 2 lo empieza sacando el otro equipo
  });

  it('no termina el set a 25-24 (hace falta diferencia de 2)', () => {
    const m = withCodes(makeMatch(), [...times('p', 24), ...times('ap', 24), 'p']);
    const s = computeMatchState(m);
    expect(s.sets).toHaveLength(1);
    expect(s.sets[0]).toMatchObject({ home: 25, away: 24, winner: null });
    const s2 = computeMatchState(withCodes(m, ['p']));
    expect(s2.sets[0]!.winner).toBe('home');
  });

  it('el set decisivo se juega a 15 y el partido termina', () => {
    const m = withCodes(makeMatch({ bestOf: 3 }), [
      ...times('p', 25), // set 1 local
      ...times('ap', 25), // set 2 visitante
      ...times('p', 15), // set 3 (decisivo) local
      '7A#', // después del final: no suma
    ]);
    const s = computeMatchState(m);
    expect(s.sets.map((x) => x.winner)).toEqual(['home', 'away', 'home']);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe('home');
    expect(s.setsWon).toEqual({ home: 2, away: 1 });
    expect(s.info[m.events.at(-1)!.id]!.afterEnd).toBe(true);
  });

  it('el cambio manual de saque cambia quién saca', () => {
    const m = withEvents(makeMatch({ firstServe: 'home' }), [{ kind: 'serve', team: 'away' }]);
    expect(computeMatchState(m).serving).toBe('away');
  });

  it('pide elegir el saque al empezar el set decisivo, y deja de pedirlo al elegir', () => {
    const m = withCodes(makeMatch({ bestOf: 3 }), [...times('p', 25), ...times('ap', 25)]);
    expect(needsTiebreakServeChoice(m, computeMatchState(m))).toBe(true);
    const elegido = withEvents(m, [{ kind: 'serve', team: 'away' }]);
    const s = computeMatchState(elegido);
    expect(needsTiebreakServeChoice(elegido, s)).toBe(false);
    expect(s.serving).toBe('away');
  });

  it('no pide elegir el saque en sets que no son el decisivo', () => {
    const m = makeMatch();
    expect(needsTiebreakServeChoice(m, computeMatchState(m))).toBe(false);
  });

  it('cuenta tiempos muertos y cambios por set y avisa al pasar el límite', () => {
    const m = withCodes(makeMatch(), ['T', 'aT', 'T', 'T', 'c7:1']);
    const s = computeMatchState(m);
    expect(s.sets[0]!.timeouts).toEqual({ home: 3, away: 1 });
    expect(s.sets[0]!.substitutions).toEqual({ home: 1, away: 0 });
    expect(s.info[m.events[3]!.id]!.warnings).toEqual(['timeout-limit']);
    expect(s.info[m.events[2]!.id]!.warnings).toEqual([]);
  });

  it('tiempos y cambios no afectan al marcador ni al saque', () => {
    const m = withCodes(makeMatch({ firstServe: 'home' }), ['T', 'c7:1', 'aT']);
    const s = computeMatchState(m);
    expect(s.sets[0]).toMatchObject({ home: 0, away: 0 });
    expect(s.serving).toBe('home');
  });

  it('un espejo sigue funcionando aunque haya un tiempo muerto en medio', () => {
    const m = withCodes(makeMatch(), ['1S#', 'aT', 'a2R=']);
    expect(computeMatchState(m).sets[0]).toMatchObject({ home: 1, away: 0 });
  });

  describe('avisos de carga', () => {
    const warningsOf = (codes: string[], firstServe: 'home' | 'away' = 'home') => {
      const m = withCodes(makeMatch({ firstServe }), codes);
      const s = computeMatchState(m);
      return m.events.map((e) => s.info[e.id]!.warnings);
    };

    it('avisa si saca el equipo que no tiene el saque', () => {
      expect(warningsOf(['a1S+'])[0]).toContain('serve-wrong-team');
      expect(warningsOf(['1S+'])[0]).toEqual([]);
    });

    it('avisa si recibe el mismo equipo que saca', () => {
      expect(warningsOf(['1S+', '2R+'])[1]).toContain('reception-by-server');
      expect(warningsOf(['1S+', 'a2R+'])[1]).toEqual([]);
    });

    it('avisa si empieza un saque sin que el rally anterior terminara', () => {
      expect(warningsOf(['1S+', 'a2R+', '1S+'])[2]).toContain('rally-not-closed');
      expect(warningsOf(['1S+', 'a2R+', 'a4A#', 'a1S+'])[3]).toEqual([]);
    });
  });

  it('borrar un evento recalcula todo', () => {
    const m = withCodes(makeMatch(), ['7A#', 'a12A#', '7A#']);
    const sinElSegundo = { ...m, events: m.events.filter((_, i) => i !== 1) };
    expect(computeMatchState(sinElSegundo).sets[0]).toMatchObject({ home: 2, away: 0 });
  });
});
