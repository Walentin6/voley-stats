/**
 * Editor de un evento del historial. Permite cambiar equipo, jugador,
 * fundamento y resultado (o los jugadores de un cambio) sin borrar y volver
 * a cargar. El evento conserva su lugar en el historial y su hora original.
 * Enter guarda, Esc cancela.
 */
import { useState } from 'react';
import { validateParsedCode, type ParsedCode } from '../../domain/code-parser';
import { QUALITIES, QUALITY_LABELS, SKILL_LABELS, SKILLS } from '../../domain/skills';
import type { Match, TeamSide } from '../../domain/types';
import { describeCode, eventToCode } from '../format';
import type { MatchEvent } from '../../domain/types';

interface Props {
  match: Match;
  event: MatchEvent;
  onSave: (code: ParsedCode) => void;
  onCancel: () => void;
}

function problemOf(match: Match, draft: ParsedCode): string | null {
  if (draft.kind === 'substitution' && draft.playerOut === draft.playerIn) {
    return 'El que sale y el que entra deben ser distintos';
  }
  return validateParsedCode(match, draft);
}

export function EventEditor({ match, event, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<ParsedCode>(() => eventToCode(event));
  const problem = problemOf(match, draft);

  const roster = (side: TeamSide) => [...match[side].players].sort((a, b) => a.number - b.number);

  const playerSelect = (label: string, value: number, onChange: (n: number) => void) => (
    <label className="field inline">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {/* Si el número no está en la plantilla de este equipo, se muestra igual para poder corregirlo */}
        {!match[draft.team].players.some((p) => p.number === value) && <option value={value}>#{value} (no está)</option>}
        {roster(draft.team).map((p) => (
          <option key={p.id} value={p.number}>
            #{p.number} {p.name}
          </option>
        ))}
      </select>
    </label>
  );

  function save() {
    if (!problem) onSave(draft);
  }

  return (
    <div
      className="event-editor"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
        if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) save();
      }}
    >
      <div className="editor-row">
        <span className="editor-label">Equipo</span>
        <div className="segmented">
          {(['home', 'away'] as const).map((side) => (
            <button
              key={side}
              className={`chip ${draft.team === side ? 'selected' : ''} ${side}`}
              onClick={() => setDraft({ ...draft, team: side })}
            >
              {match[side].name}
            </button>
          ))}
        </div>
      </div>

      {draft.kind === 'action' && (
        <>
          <div className="editor-row">
            {playerSelect('Jugador', draft.playerNumber, (n) => setDraft({ ...draft, playerNumber: n }))}
          </div>
          <div className="editor-row">
            <span className="editor-label">Fundamento</span>
            <div className="chip-row">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  className={`chip ${draft.skill === s ? 'selected' : ''}`}
                  onClick={() => setDraft({ ...draft, skill: s })}
                  title={SKILL_LABELS[s]}
                >
                  <span className="code">{s}</span> {SKILL_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="editor-row">
            <span className="editor-label">Resultado</span>
            <div className="chip-row">
              {QUALITIES.map((q, i) => (
                <button
                  key={q}
                  className={`chip q-${i} ${draft.quality === q ? 'selected' : ''}`}
                  onClick={() => setDraft({ ...draft, quality: q })}
                >
                  <span className="code">{q}</span> {QUALITY_LABELS[draft.skill][q]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {draft.kind === 'substitution' && (
        <div className="editor-row">
          {playerSelect('Sale', draft.playerOut, (n) => setDraft({ ...draft, playerOut: n }))}
          {playerSelect('Entra', draft.playerIn, (n) => setDraft({ ...draft, playerIn: n }))}
        </div>
      )}

      <p className={`small ${problem ? 'error' : 'muted'}`}>{problem ?? `Quedará: ${describeCode(match, draft)}`}</p>

      <div className="editor-actions">
        <button className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn primary" onClick={save} disabled={problem !== null}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
