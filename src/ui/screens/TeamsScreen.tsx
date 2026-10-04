import { useState } from 'react';
import { deleteTeam, listTeams } from '../../storage/repository';
import { Page } from '../components/Page';
import type { Navigate } from '../navigation';

export function TeamsScreen({ navigate }: { navigate: Navigate }) {
  const [teams, setTeams] = useState(() => listTeams());

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Borrar el equipo "${name}"? Los partidos ya jugados no se pierden.`)) return;
    deleteTeam(id);
    setTeams(listTeams());
  }

  return (
    <Page title="Equipos" onBack={() => navigate({ name: 'home' })}>
      <div className="row-between">
        <h2>Equipos guardados</h2>
        <button className="btn primary" onClick={() => navigate({ name: 'team-editor', teamId: null })}>
          + Nuevo equipo
        </button>
      </div>

      {teams.length === 0 ? (
        <p className="muted">Todavía no hay equipos.</p>
      ) : (
        <ul className="card-list">
          {teams.map((t) => (
            <li key={t.id} className="card">
              <button className="card-main" onClick={() => navigate({ name: 'team-editor', teamId: t.id })}>
                <span className="card-title">{t.name}</span>
                <span className="muted small">{t.players.length} jugadores</span>
              </button>
              <button className="btn ghost danger" onClick={() => handleDelete(t.id, t.name)}>
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
