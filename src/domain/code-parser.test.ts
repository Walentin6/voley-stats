import { describe, expect, it } from 'vitest';
import { parseCode, parseLine, validateParsedCode } from './code-parser';
import { makeMatch, withCodes } from './test-helpers';

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

  it('interpreta el free ball (F)', () => {
    expect(parseCode('a6F+')).toMatchObject({ ok: true, value: { team: 'away', playerNumber: 6, skill: 'F' } });
  });

  it('interpreta puntos manuales', () => {
    expect(parseCode('p')).toEqual({ ok: true, value: { kind: 'point', team: 'home' } });
    expect(parseCode('*p')).toEqual({ ok: true, value: { kind: 'point', team: 'home' } });
    expect(parseCode('AP')).toEqual({ ok: true, value: { kind: 'point', team: 'away' } });
  });

  it('interpreta tiempos muertos', () => {
    expect(parseCode('T')).toEqual({ ok: true, value: { kind: 'timeout', team: 'home' } });
    expect(parseCode('at')).toEqual({ ok: true, value: { kind: 'timeout', team: 'away' } });
  });

  it('interpreta cambios con : o con .', () => {
    expect(parseCode('c7:12')).toEqual({
      ok: true,
      value: { kind: 'substitution', team: 'home', playerOut: 7, playerIn: 12 },
    });
    expect(parseCode('aC3.6')).toMatchObject({ ok: true, value: { team: 'away', playerOut: 3, playerIn: 6 } });
    expect(parseCode('c7:7').ok).toBe(false);
  });

  it('rechaza códigos mal formados', () => {
    expect(parseCode('').ok).toBe(false);
    expect(parseCode('A#').ok).toBe(false);
    expect(parseCode('123A#').ok).toBe(false);
    expect(parseCode('7X#').ok).toBe(false);
    expect(parseCode('7A?').ok).toBe(false);
  });
});

describe('equipo por defecto según el saque', () => {
  const ctx = { servingTeam: 'away' as const };

  it('un saque sin prefijo es del equipo que saca', () => {
    expect(parseCode('3S+', ctx)).toMatchObject({ ok: true, value: { team: 'away', skill: 'S' } });
  });

  it('una recepción sin prefijo es del equipo que recibe', () => {
    expect(parseCode('4R-', ctx)).toMatchObject({ ok: true, value: { team: 'home', skill: 'R' } });
  });

  it('los demás fundamentos sin prefijo siguen siendo del local', () => {
    expect(parseCode('7A#', ctx)).toMatchObject({ ok: true, value: { team: 'home' } });
  });

  it('el prefijo explícito siempre se respeta', () => {
    expect(parseCode('*1S#', ctx)).toMatchObject({ ok: true, value: { team: 'home' } });
    expect(parseCode('a2R+', ctx)).toMatchObject({ ok: true, value: { team: 'away' } });
  });
});

describe('parseLine', () => {
  it('después de un error de saque local, el siguiente saque es del visitante', () => {
    const match = withCodes(makeMatch({ firstServe: 'home' }), ['5S=']);
    const r = parseLine(match, '3S+ 4R-');
    expect(r).toMatchObject({
      ok: true,
      codes: [
        { team: 'away', playerNumber: 3, skill: 'S' },
        { team: 'home', playerNumber: 4, skill: 'R' },
      ],
    });
  });

  it('en una misma línea, el saque cambia cuando termina un rally', () => {
    const match = makeMatch({ firstServe: 'home' });
    const r = parseLine(match, '5S= 3S+');
    expect(r).toMatchObject({ ok: true, codes: [{ team: 'home' }, { team: 'away' }] });
  });

  it('si un código es inválido no devuelve ninguno', () => {
    expect(parseLine(makeMatch(), '7A# 99A#').ok).toBe(false);
  });

  it('devuelve los avisos de cada código', () => {
    // *2R+ = recepción del local, que es el que saca → aviso
    const r = parseLine(makeMatch({ firstServe: 'home' }), '1S+ *2R+');
    expect(r).toMatchObject({ ok: true, warnings: [[], ['reception-by-server']] });
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

  it('en un cambio, comprueba los dos jugadores', () => {
    const match = makeMatch();
    const r = parseCode('c7:99');
    if (!r.ok) throw new Error('parse');
    expect(validateParsedCode(match, r.value)).toContain('99');
  });
});
