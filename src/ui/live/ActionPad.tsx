/**
 * Carga de acciones con botones (pensado para pantallas táctiles).
 * Flujo de una acción: 1) jugador → 2) fundamento → 3) resultado.
 * Flujo de un cambio: "Cambio" → jugador que sale → jugador que entra.
 */
import { useState } from 'react';
import type { ParsedCode } from '../../domain/code-parser';
import { SUBSTITUTIONS_PER_SET, TIMEOUTS_PER_SET, type MatchState } from '../../domain/match-state';
import { QUALITIES, QUALITY_LABELS, SKILL_LABELS, SKILLS } from '../../domain/skills';
import type { Match, Quality, Skill, TeamSide } from '../../domain/types';
import { otherSide } from '../../domain/types';
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

/** Cambio en curso: equipo y (si ya se eligió) jugador que sale. */
interface SubDraft {
  team: TeamSide;
  playerOut: number | null;
}

export function ActionPad({ match, state, disabled, onRecord, onUndo }: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [sub, setSub] = useState<SubDraft | null>(null);
  const currentSet = state.sets[state.currentSetIndex]!;

  function reset() {
    setSelected(null);
    setSkill(null);
    setSub(null);
  }

  function record(code: ParsedCode) {
    onRecord(code);
    reset();
  }

  function pickQuality(quality: Quality) {
    if (!selected || !skill) return;
    record({ kind: 'action', team: selected.team, playerNumber: selected.playerNumber, skill, quality });
  }

  /** Empieza (o cancela) un cambio para ese equipo. */
  function toggleSub(team: TeamSide) {
    const wasActive = sub?.team === team;
    reset();
    if (!wasActive) setSub({ team, playerOut: null });
  }

  function pickPlayer(team: TeamSide, playerNumber: number) {
    if (sub) {
      if (team !== sub.team) return;
      if (sub.playerOut === null) setSub({ team, playerOut: playerNumber });
      else if (sub.playerOut === playerNumber) setSub({ team, playerOut: null });
      else record({ kind: 'substitution', team, playerOut: sub.playerOut, playerIn: playerNumber });
      return;
    }
    const isSel = selected?.team === team && selected.playerNumber === playerNumber;
    setSelected(isSel ? null : { team, playerNumber });
  }

  const teamColumn = (side: TeamSide) => {
    const timeouts = currentSet.timeouts[side];
    const subs = currentSet.substitutions[side];
    const subActive = sub?.team === side;
    return (
      <div className={`pad-team ${side}`}>
        <div className="pad-team-name">
          {match[side].name}
          {state.serving === side && !state.finished && <span className="tag">saca</span>}
        </div>
        <div className="player-grid">
          {match[side].players.map((p) => {
            const isSel =
              (selected?.team === side && selected.playerNumber === p.number) ||
              (subActive && sub?.playerOut === p.number);
            return (
              <button
                key={p.id}
                className={`player-btn ${isSel ? 'selected' : ''} ${p.position === 'L' ? 'libero' : ''}`}
                disabled={disabled || (sub !== null && !subActive)}
                onClick={() => pickPlayer(side, p.number)}
                title={p.name}
              >
                <span className="player-num">{p.number}</span>
                <span className="player-name">{p.name || ' '}</span>
              </button>
            );
          })}
        </div>
        <div className="team-actions">
          <button className="btn point-btn" disabled={disabled || sub !== null} onClick={() => record({ kind: 'point', team: side })}>
            + Punto
          </button>
          <button
            className={`btn ${timeouts >= TIMEOUTS_PER_SET ? 'at-limit' : ''}`}
            disabled={disabled || sub !== null}
            onClick={() => record({ kind: 'timeout', team: side })}
            title="Tiempo muerto"
          >
            Tiempo {timeouts}/{TIMEOUTS_PER_SET}
          </button>
          <button
            className={`btn ${subActive ? 'active' : ''} ${subs >= SUBSTITUTIONS_PER_SET ? 'at-limit' : ''}`}
            disabled={disabled || (sub !== null && !subActive)}
            onClick={() => toggleSub(side)}
            title="Cambio de jugador"
          >
            Cambio {subs}/{SUBSTITUTIONS_PER_SET}
          </button>
        </div>
      </div>
    );
  };

  let hint: string;
  if (sub) {
    hint =
      sub.playerOut === null
        ? `Cambio de ${match[sub.team].name} · elige quién SALE`
        : `Cambio de ${match[sub.team].name} · sale ${playerLabel(match, sub.team, sub.playerOut)} · elige quién ENTRA`;
  } else if (selected) {
    hint = `${match[selected.team].name} · ${playerLabel(match, selected.team, selected.playerNumber)}${
      skill ? ` · ${SKILL_LABELS[skill]} · elige el resultado` : ' · elige el fundamento'
    }`;
  } else {
    hint = skill ? `${SKILL_LABELS[skill]} · elige el jugador` : '1) Jugador  →  2) Fundamento  →  3) Resultado';
  }

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
            disabled={disabled || sub !== null}
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
        {(selected || skill || sub) && (
          <button className="btn ghost" onClick={reset}>
            Cancelar selección
          </button>
        )}
        <button
          className="btn"
          disabled={disabled}
          onClick={() => {
            const next = otherSide(state.serving);
            if (confirm(`¿Pasar el saque a ${match[next].name}? Úsalo solo para corregir un error.`)) {
              record({ kind: 'serve', team: next });
            }
          }}
        >
          ⇄ Cambiar saque
        </button>
        <button className="btn" onClick={onUndo} disabled={match.events.length === 0}>
          ↶ Deshacer última
        </button>
      </div>
    </section>
  );
}
