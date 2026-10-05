import { describe, expect, it } from 'vitest';
import { eventFromCode } from './factories';
import { computeMatchState } from './match-state';
import { makeMatch, withCodes } from './test-helpers';

describe('eventFromCode', () => {
  it('crea un evento nuevo con id y hora propios', () => {
    const a = eventFromCode({ kind: 'point', team: 'home' });
    const b = eventFromCode({ kind: 'point', team: 'home' });
    expect(a.id).not.toBe(b.id);
  });

  it('al editar conserva el id y la hora originales', () => {
    const original = eventFromCode({ kind: 'action', team: 'home', playerNumber: 7, skill: 'A', quality: '+' });
    const edited = eventFromCode(
      { kind: 'action', team: 'home', playerNumber: 9, skill: 'A', quality: '#' },
      original,
    );
    expect(edited).toMatchObject({ id: original.id, timestamp: original.timestamp, playerNumber: 9, quality: '#' });
  });

  it('editar una acción del medio recalcula el marcador', () => {
    const m = withCodes(makeMatch(), ['7A+', '7A#', 'a12A#']);
    expect(computeMatchState(m).sets[0]).toMatchObject({ home: 1, away: 1 });
    const first = m.events[0]!;
    const edited = eventFromCode({ kind: 'action', team: 'home', playerNumber: 7, skill: 'A', quality: '#' }, first);
    const m2 = { ...m, events: m.events.map((e) => (e.id === first.id ? edited : e)) };
    expect(computeMatchState(m2).sets[0]).toMatchObject({ home: 2, away: 1 });
  });
});
