import { describe, expect, it } from 'vitest';
import { makeMatch, withCodes } from '../domain/test-helpers';
import { parseMatchJson } from './import';

describe('parseMatchJson', () => {
  it('acepta un partido exportado y lo deja igual', () => {
    const m = withCodes(makeMatch(), ['1S+', 'a2R-', 'a12A#', 'T', 'c7:1', 'ap']);
    const r = parseMatchJson(JSON.stringify(m, null, 2));
    expect(r).toEqual({ ok: true, match: m });
  });

  it('rechaza un archivo que no es JSON', () => {
    expect(parseMatchJson('hola')).toMatchObject({ ok: false, error: expect.stringContaining('JSON') });
  });

  it('rechaza un JSON que no es un partido', () => {
    expect(parseMatchJson('[1,2,3]').ok).toBe(false);
    expect(parseMatchJson('{"id":"x"}').ok).toBe(false);
  });

  it('indica qué evento está dañado', () => {
    const m = withCodes(makeMatch(), ['1S+', '7A#']);
    const data = JSON.parse(JSON.stringify(m));
    data.events[1].skill = 'X';
    expect(parseMatchJson(JSON.stringify(data))).toMatchObject({
      ok: false,
      error: expect.stringContaining('Evento 2'),
    });
  });
});
