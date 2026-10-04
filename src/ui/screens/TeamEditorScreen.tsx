import { useState } from 'react';
import { createTeam } from '../../domain/factories';
import { createId, nowIso } from '../../domain/ids';
import { POSITION_LABELS } from '../../domain/skills';
import type { Player, Position, Team } from '../../domain/types';
import { getTeam, saveTeam } from '../../storage/repository';
import { Page } from '../components/Page';
import type { Navigate } from '../navigation';

interface Props {
  navigate: Navigate;
  teamId: string | null;
}

/** Fila editable: el número se guarda como texto mientras se escribe. */
interface PlayerDraft extends Omit<Player, 'number'> {
  number: string;
}

function validate(name: string, players: PlayerDraft[]): string | null {
  if (!name.trim()) return 'El equipo necesita un nombre.';
  const seen = new Set<number>();
  for (const p of players) {
    const n = Number(p.number);
    if (p.number.trim() === '' || !Number.isInteger(n) || n < 0 || n > 99) {
      return `El número "${p.number}" no es válido (debe ser de 0 a 99).`;
    }
    if (seen.has(n)) return `El número ${n} está repetido.`;
    seen.add(n);
  }
  return null;
}

export function TeamEditorScreen({ navigate, teamId }: Props) {
  const [original] = useState<Team>(() => (teamId && getTeam(teamId)) || createTeam());
  const [name, setName] = useState(original.name);
  const [players, setPlayers] = useState<PlayerDraft[]>(() =>
    original.players.map((p) => ({ ...p, number: String(p.number) })),
  );
  const [error, setError] = useState<string | null>(null);

  function updatePlayer(id: string, patch: Partial<PlayerDraft>) {
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPlayer() {
    const used = new Set(players.map((p) => Number(p.number)));
    let next = 1;
    while (used.has(next) && next < 99) next++;
    setPlayers((ps) => [...ps, { id: createId(), number: String(next), name: '' }]);
  }

  function handleSave() {
    const problem = validate(name, players);
    if (problem) {
      setError(problem);
      return;
    }
    saveTeam({
      ...original,
      name: name.trim(),
      players: players
        .map((p) => ({ ...p, number: Number(p.number), name: p.name.trim() }))
        .sort((a, b) => a.number - b.number),
      updatedAt: nowIso(),
    });
    navigate({ name: 'teams' });
  }

  return (
    <Page
      title={teamId ? 'Editar equipo' : 'Nuevo equipo'}
      onBack={() => navigate({ name: 'teams' })}
      actions={
        <button className="btn primary" onClick={handleSave}>
          Guardar
        </button>
      }
    >
      <label className="field">
        <span>Nombre del equipo</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Club Atlético" autoFocus />
      </label>

      <div className="row-between">
        <h2>Jugadores ({players.length})</h2>
        <button className="btn" onClick={addPlayer}>
          + Agregar jugador
        </button>
      </div>

      {players.length === 0 && <p className="muted">Agrega los jugadores con su número de camiseta.</p>}

      <ul className="player-rows">
        {players.map((p) => (
          <li key={p.id} className="player-row">
            <input
              className="num-input"
              inputMode="numeric"
              value={p.number}
              onChange={(e) => updatePlayer(p.id, { number: e.target.value })}
              aria-label="Número"
            />
            <input
              value={p.name}
              onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
              placeholder="Nombre"
              aria-label="Nombre"
            />
            <select
              value={p.position ?? ''}
              onChange={(e) => updatePlayer(p.id, { position: (e.target.value || undefined) as Position | undefined })}
              aria-label="Posición"
            >
              <option value="">Posición</option>
              {(Object.keys(POSITION_LABELS) as Position[]).map((pos) => (
                <option key={pos} value={pos}>
                  {POSITION_LABELS[pos]}
                </option>
              ))}
            </select>
            <button
              className="btn ghost danger"
              onClick={() => setPlayers((ps) => ps.filter((x) => x.id !== p.id))}
              aria-label="Quitar jugador"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="error">{error}</p>}
    </Page>
  );
}
