import { describe, expect, it } from 'vitest';
import { parseCode, validateParsedCode } from './code-parser';
import { makeMatch } from './test-helpers';

describe('parseCode', () => {
  it('interpreta una acción local sin prefijo', () => {
    expect(parseCode('7A#')).toEqual({
      ok: true,
      value: { kind: 'action', team: 'home', playerNumber: 7, skill: 'A', quality: '#' },
    });
  });

  it('interpreta el prefijo * como local y a como visitante', () => {
    expect(parseCode('*4S=')).toMatchObject({ ok: true, value: { team: 'home', playerNumber: 4 } });
    expect(parseCode('a12R+')).toMatchObject({
      ok: true,
      value: { team: 'away', playerNumber: 12, skill: 'R', quality: '+' },
    });
  });

  it('acepta minúsculas y espacios alrededor', () => {
    expect(parseCode('  a3b/ ')).toMatchObject({ ok: true, value: { team: 'away', skill: 'B', quality: '/' } });
  });

  it('interpreta puntos manuales', () => {
    expect(parseCode('p')).toEqual({ ok: true, value: { kind: 'point', team: 'home' } });
    expect(parseCode('*p')).toEqual({ ok: true, value: { kind: 'point', team: 'home' } });
    expect(parseCode('AP')).toEqual({ ok: true, value: { kind: 'point', team: 'away' } });
  });

  it('rechaza códigos mal formados', () => {
    expect(parseCode('').ok).toBe(false);
    expect(parseCode('A#').ok).toBe(false);
    expect(parseCode('123A#').ok).toBe(false);
    expect(parseCode('7X#').ok).toBe(false);
    expect(parseCode('7A?').ok).toBe(false);
  });
});

describe('validateParsedCode', () => {
  it('rechaza números que no están en la plantilla', () => {
    const match = makeMatch();
    const ok = parseCode('a12A#');
    const bad = parseCode('a99A#');
    if (!ok.ok || !bad.ok) throw new Error('parse');
    expect(validateParsedCode(match, ok.value)).toBeNull();
    expect(validateParsedCode(match, bad.value)).toContain('99');
  });
});
