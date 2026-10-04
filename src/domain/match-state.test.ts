import { describe, expect, it } from 'vitest';
import { computeMatchState } from './match-state';
import { makeMatch, times, withCodes } from './test-helpers';

describe('computeMatchState', () => {
  it('empieza 0-0 en el primer set con el saque elegido', () => {
    const s = computeMatchState(makeMatch({ firstServe: 'away' }));
    expect(s.sets).toEqual([{ home: 0, away: 0, winner: null }]);
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
    expect(s.sets[0]).toEqual({ home: 25, away: 0, winner: 'home' });
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

  it('borrar un evento recalcula todo', () => {
    const m = withCodes(makeMatch(), ['7A#', 'a12A#', '7A#']);
    const sinElSegundo = { ...m, events: m.events.filter((_, i) => i !== 1) };
    expect(computeMatchState(sinElSegundo).sets[0]).toMatchObject({ home: 2, away: 0 });
  });
});
