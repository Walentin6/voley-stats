/**
 * Carga de acciones con botones (pensado para pantallas táctiles).
 * Flujo: 1) jugador → 2) fundamento → 3) resultado. Al elegir el resultado
 * la acción se registra y la selección se limpia.
 */
import { useState } from 'react';
import type { ParsedCode } from '../../domain/code-parser';
import type { MatchState } from '../../domain/match-state';
import { QUALITIES, QUALITY_LABELS, SKILL_LABELS, SKILLS } from '../../domain/skills';
import type { Match, Quality, Skill, TeamSide } from '../../domain/types';
import { playerLabel } from '../format';

interface Props {
  match: Match;
  state: MatchState;
  disabled: boolean;
  onRecord: (code: ParsedCode) => void;
  onUndo: () => void;
}

interface Selection {
  team: TeamSide;
  playerNumber: number;
}

export function ActionPad({ match, state, disabled, onRecord, onUndo }: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);

  function reset() {
    setSelected(null);
    setSkill(null);
  }

  function pickQuality(quality: Quality) {
    if (!selected || !skill) return;
    onRecord({ kind: 'action', team: selected.team, playerNumber: selected.playerNumber, skill, quality });
    reset();
  }

  function recordPoint(team: TeamSide) {
    onRecord({ kind: 'point', team });
    reset();
  }

  const teamColumn = (side: TeamSide) => (
    <div className={`pad-team ${side}`}>
      <div className="pad-team-name">
        {match[side].name}
        {state.serving === side && !state.finished && <span className="tag">saca</span>}
      </div>
      <div className="player-grid">
        {match[side].players.map((p) => {
          const isSel = selected?.team === side && selected.playerNumber === p.number;
          return (
            <button
              key={p.id}
              className={`player-btn ${isSel ? 'selected' : ''} ${p.position === 'L' ? 'libero' : ''}`}
              disabled={disabled}
              onClick={() => setSelected(isSel ? null : { team: side, playerNumber: p.number })}
              title={p.name}
            >
              <span className="player-num">{p.number}</span>
              <span className="player-name">{p.name || ' '}</span>
            </button>
          );
        })}
      </div>
      <button className="btn point-btn" disabled={disabled} onClick={() => recordPoint(side)}>
        + Punto {match[side].name}
      </button>
    </div>
  );

  const hint = selected
    ? `${match[selected.team].name} · ${playerLabel(match, selected.team, selected.playerNumber)}${
        skill ? ` · ${SKILL_LABELS[skill]} · elige el resultado` : ' · elige el fundamento'
      }`
    : skill
      ? `${SKILL_LABELS[skill]} · elige el jugador`
      : '1) Jugador  →  2) Fundamento  →  3) Resultado';

  return (
    <section className="pad" aria-label="Carga con botones">
      <div className="pad-teams">
        {teamColumn('home')}
        {teamColumn('away')}
      </div>

      <p className="pad-hint">{hint}</p>

      <div className="skill-bar">
        {SKILLS.map((s) => (
          <button
            key={s}
            className={`skill-btn ${skill === s ? 'selected' : ''}`}
            disabled={disabled}
            onClick={() => setSkill(skill === s ? null : s)}
          >
            <span className="code">{s}</span>
            {SKILL_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="quality-bar">
        {QUALITIES.map((q) => (
          <button
            key={q}
            className={`quality-btn q-${QUALITIES.indexOf(q)}`}
            disabled={disabled || !selected || !skill}
            onClick={() => pickQuality(q)}
          >
            <span className="code">{q}</span>
            <span className="small">{skill ? QUALITY_LABELS[skill][q] : ' '}</span>
          </button>
        ))}
      </div>

      <div className="pad-footer">
        {(selected || skill) && (
          <button className="btn ghost" onClick={reset}>
            Cancelar selección
          </button>
        )}
        <button className="btn" onClick={onUndo} disabled={match.events.length === 0}>
          ↶ Deshacer última
        </button>
      </div>
    </section>
  );
}
