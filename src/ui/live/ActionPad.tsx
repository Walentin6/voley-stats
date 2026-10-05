/**
 * Carga de acciones con botones (pensado para pantallas táctiles).
 * Flujo de una acción: 1) jugador → 2) fundamento → 3) resultado.
 * Flujo de un cambio: "Cambio" → jugador que sale → jugador que entra.
 * Con formación cargada, se dibuja la cancha (P1–P6) y el banco aparte, y el
 * saque se puede registrar sin elegir jugador: "Saque" → resultado.
 */
import { useState } from 'react';
import type { ParsedCode } from '../../domain/code-parser';
import { SUBSTITUTIONS_PER_SET, TIMEOUTS_PER_SET, type MatchState } from '../../domain/match-state';
import { QUALITIES, QUALITY_LABELS, SKILL_LABELS, SKILLS } from '../../domain/skills';
import type { Match, Player, Quality, Skill, TeamSide } from '../../domain/types';
import { otherSide } from '../../domain/types';
import { playerLabel } from '../format';

interface Props {
  match: Match;
  state: MatchState;
  disabled: boolean;
  onRecord: (code: ParsedCode) => void;
  onUndo: () => void;
  onEditLineup: (team: TeamSide) => void;
}

/** Orden de las posiciones en la cuadrícula: adelante P4 P3 P2, atrás P5 P6 P1. */
const COURT_LAYOUT = [3, 2, 1, 4, 5, 0];

interface Selection {
  team: TeamSide;
  playerNumber: number;
}

/** Cambio en curso: equipo y (si ya se eligió) jugador que sale. */
interface SubDraft {
  team: TeamSide;
  playerOut: number | null;
}

export function ActionPad({ match, state, disabled, onRecord, onUndo, onEditLineup }: Props) {
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

  // Con formación cargada, el saque se puede registrar sin elegir jugador: lo hace el de P1.
  // quickServer = jugador que saca si se eligió "Saque" sin elegir jugador.
  const quickServer = !selected && skill === 'S' ? state.courts[state.serving]?.positions[0] : undefined;
  const quickServe = quickServer !== undefined;

  function pickQuality(quality: Quality) {
    if (quickServer !== undefined) {
      record({ kind: 'action', team: state.serving, playerNumber: quickServer, skill: 'S', quality });
      return;
    }
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
    const court = state.courts[side];

    const playerButton = (p: Player, positionLabel?: string) => {
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
          {positionLabel && <span className="player-pos">{positionLabel}</span>}
          <span className="player-num">{p.number}</span>
          <span className="player-name">{p.name || ' '}</span>
        </button>
      );
    };

    const byNumber = (n: number) =>
      match[side].players.find((p) => p.number === n) ?? { id: `x${n}`, number: n, name: '' };

    return (
      <div className={`pad-team ${side}`}>
        <div className="pad-team-name">
          {match[side].name}
          {state.serving === side && !state.finished && <span className="tag">saca</span>}
          {court && <span className="tag rotation" title="Rotación">{court.label}</span>}
        </div>
        {court ? (
          <>
            {/* Cancha vista desde atrás: la red arriba */}
            <div className="court-grid">
              {COURT_LAYOUT.map((idx) => playerButton(byNumber(court.positions[idx]!), `P${idx + 1}`))}
            </div>
            <div className="bench-label small muted">Banco</div>
            <div className="player-grid bench">
              {match[side].players.filter((p) => !court.positions.includes(p.number)).map((p) => playerButton(p))}
            </div>
          </>
        ) : (
          <div className="player-grid">{match[side].players.map((p) => playerButton(p))}</div>
        )}
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
          <button
            className="btn"
            disabled={state.finished || sub !== null}
            onClick={() => onEditLineup(side)}
            title="Cargar o corregir la formación en cancha"
          >
            Formación
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
  } else if (quickServer !== undefined) {
    hint = `Saque de ${match[state.serving].name} · ${playerLabel(match, state.serving, quickServer)} (P1) · elige el resultado`;
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
            disabled={disabled || !((selected && skill) || quickServe)}
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
