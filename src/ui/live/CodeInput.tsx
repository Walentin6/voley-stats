/**
 * Carga rápida con teclado usando códigos (ver docs/05-codigos-de-scouting.md).
 * Se pueden escribir varios códigos separados por espacios: "1S# a2R= ".
 */
import { useState } from 'react';
import { parseCode, validateParsedCode, type ParsedCode } from '../../domain/code-parser';
import type { Match } from '../../domain/types';
import { describeCode } from '../format';

interface Props {
  match: Match;
  disabled: boolean;
  onRecord: (code: ParsedCode) => void;
}

type Check = { ok: true; codes: ParsedCode[] } | { ok: false; error: string };

function check(match: Match, text: string): Check {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const codes: ParsedCode[] = [];
  for (const part of parts) {
    const r = parseCode(part);
    if (!r.ok) return { ok: false, error: r.error };
    const problem = validateParsedCode(match, r.value);
    if (problem) return { ok: false, error: problem };
    codes.push(r.value);
  }
  return { ok: true, codes };
}

export function CodeInput({ match, disabled, onRecord }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = text.trim() ? check(match, text) : null;

  function submit() {
    if (!text.trim()) return;
    const result = check(match, text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    result.codes.forEach(onRecord);
    setText('');
    setError(null);
  }

  return (
    <section className="code-input" aria-label="Carga con códigos">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Código: 7A#  ·  a12R+  ·  ap   (Enter para registrar)"
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Código de scouting"
        />
        <button className="btn primary" type="submit" disabled={disabled || !text.trim()}>
          Registrar
        </button>
      </form>
      <p className={`small ${error || (preview && !preview.ok) ? 'error' : 'muted'}`}>
        {error ??
          (preview
            ? preview.ok
              ? preview.codes.map((c) => describeCode(match, c)).join('  |  ')
              : preview.error
            : 'Sin prefijo o * = local, a = visitante. Fundamentos: S R E A B D. Calidades: # + ! - / =')}
      </p>
    </section>
  );
}
