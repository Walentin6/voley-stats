/**
 * Carga rápida con teclado usando códigos (ver docs/05-codigos-de-scouting.md).
 * Se pueden escribir varios códigos separados por espacios: "1S# a2R= ".
 */
import { useState } from 'react';
import { parseLine, type ParsedCode } from '../../domain/code-parser';
import type { Match } from '../../domain/types';
import { describeCode } from '../format';

interface Props {
  match: Match;
  disabled: boolean;
  onRecord: (code: ParsedCode) => void;
}

export function CodeInput({ match, disabled, onRecord }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = text.trim() ? parseLine(match, text) : null;

  function submit() {
    if (!text.trim()) return;
    const result = parseLine(match, text);
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
            : '* = local, a = visitante. Sin prefijo: S = quien saca, R = quien recibe, resto = local. Fundamentos: S R E A B D F. Calidades: # + ! - / =')}
      </p>
    </section>
  );
}
