/**
 * Carga de la formación de un equipo: 6 jugadores en sus posiciones,
 * dibujados como se ven en la cancha (la red arriba).
 *
 *        RED
 *   P4   P3   P2
 *   P5   P6   P1   ← P1 saca
 */
import { useState } from 'react';
import { isLibero, validateLineup, type Lineup } from '../../domain/rotation';
import type { Match, TeamSide } from '../../domain/types';

interface Props {
  match: Match;
  team: TeamSide;
  /** Formación propuesta (por ejemplo, la del set anterior). */
  initial: Lineup | null;
  title: string;
  onSave: (lineup: Lineup) => void;
  onCancel?: () => void;
}

/** Orden visual de las posiciones: fila de adelante y fila de atrás. */
const LAYOUT = [
  [3, 2, 1], // P4 P3 P2
  [4, 5, 0], // P5 P6 P1
];

export function LineupEditor({ match, team, initial, title, onSave, onCancel }: Props) {
  // null = posición sin elegir
  const [slots, setSlots] = useState<(number | null)[]>(() => initial ?? Array(6).fill(null));
  const players = [...match[team].players]
    .filter((p) => !isLibero(match[team].players, p.number))
    .sort((a, b) => a.number - b.number);

  const complete = slots.every((n) => n !== null);
  const problem = complete ? validateLineup(match, team, slots as Lineup) : 'Elige un jugador para cada posición';

  function setSlot(index: number, value: number | null) {
    setSlots((s) => s.map((n, i) => (i === index ? value : n)));
  }

  return (
    <div className={`lineup-editor ${team}`}>
      <div className="lineup-title">{title}</div>
      <div className="lineup-net">RED</div>
      <div className="lineup-court">
        {LAYOUT.flat().map((idx) => (
          <label key={idx} className={`lineup-slot ${idx === 0 ? 'server' : ''}`}>
            <span>P{idx + 1}{idx === 0 ? ' · saca' : ''}</span>
            <select
              value={slots[idx] ?? ''}
              onChange={(e) => setSlot(idx, e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">–</option>
              {players.map((p) => (
                <option key={p.id} value={p.number}>
                  #{p.number} {p.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className={`small ${problem && complete ? 'error' : 'muted'}`}>
        {problem ?? 'Formación lista. El líbero no va aquí: sus acciones se cargan con su número.'}
      </p>
      <div className="editor-actions">
        {onCancel && (
          <button className="btn ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="btn primary" disabled={problem !== null} onClick={() => onSave(slots as Lineup)}>
          Guardar formación
        </button>
      </div>
    </div>
  );
}
