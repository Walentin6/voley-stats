/**
 * Carga rápida con teclado usando códigos (ver docs/05-codigos-de-scouting.md).
 * Se pueden escribir varios códigos separados por espacios: "1S# a2R= ".
 */
import { useState, type Ref } from 'react';
import { parseLine, type ParsedCode } from '../../domain/code-parser';
import type { Match } from '../../domain/types';
import { describeCode, WARNING_LABELS } from '../format';

interface Props {
  match: Match;
  disabled: boolean;
  onRecord: (code: ParsedCode) => void;
  /** Para que la pantalla pueda poner el foco aquí (atajos de teclado). */
  inputRef?: Ref<HTMLInputElement>;
}

const HELP =
  '* = local, a = visitante. Sin prefijo: S = quien saca, R = quien recibe, resto = local. ' +
  'Fundamentos: S R E A B D F · Calidades: # + ! - / = · T = tiempo · c7:12 = cambio';

export function CodeInput({ match, disabled, onRecord, inputRef }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = text.trim() ? parseLine(match, text) : null;
  const previewWarnings = preview?.ok ? [...new Set(preview.warnings.flat())] : [];

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

  let message: string;
  let tone: 'muted' | 'error' | 'warn' = 'muted';
  if (error) {
    message = error;
    tone = 'error';
  } else if (!preview) {
    message = HELP;
  } else if (!preview.ok) {
    message = preview.error;
    tone = 'error';
  } else {
    message = preview.codes.map((c) => describeCode(match, c)).join('  |  ');
    if (previewWarnings.length > 0) tone = 'warn';
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
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setText('');
              setError(null);
            }
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
      <p className={`small ${tone}`}>{message}</p>
      {previewWarnings.length > 0 && (
        <p className="small warn">⚠ {previewWarnings.map((w) => WARNING_LABELS[w]).join(' · ')}</p>
      )}
    </section>
  );
}
