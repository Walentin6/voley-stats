import { useState } from 'react';
import { computeMatchState } from '../../domain/match-state';
import { deleteMatch, listMatches, listTeams } from '../../storage/repository';
import { Page } from '../components/Page';
import { formatDate } from '../format';
import type { Navigate } from '../navigation';

export function HomeScreen({ navigate }: { navigate: Navigate }) {
  const [matches, setMatches] = useState(() => listMatches());
  const teamCount = listTeams().length;

  function handleDelete(id: string, label: string) {
    if (!confirm(`¿Borrar el partido ${label}? No se puede deshacer.`)) return;
    deleteMatch(id);
    setMatches(listMatches());
  }

  return (
    <Page
      title="VoleyStats"
      actions={
        <button className="btn ghost" onClick={() => navigate({ name: 'teams' })}>
          Equipos ({teamCount})
        </button>
      }
    >
      <div className="row-between">
        <h2>Partidos</h2>
        <button className="btn primary" onClick={() => navigate({ name: 'new-match' })}>
          + Nuevo partido
        </button>
      </div>

      {teamCount < 2 && (
        <p className="notice">
          Para empezar, crea al menos dos equipos con sus jugadores en{' '}
          <button className="link" onClick={() => navigate({ name: 'teams' })}>
            Equipos
          </button>
          .
        </p>
      )}

      {matches.length === 0 ? (
        <p className="muted">Todavía no hay partidos.</p>
      ) : (
        <ul className="card-list">
          {matches.map((m) => {
            const s = computeMatchState(m);
            const label = `${m.home.name} vs ${m.away.name}`;
            return (
              <li key={m.id} className="card">
                <button className="card-main" onClick={() => navigate({ name: 'match', matchId: m.id })}>
                  <span className="card-title">
                    {m.home.name} <strong>{s.setsWon.home}</strong> – <strong>{s.setsWon.away}</strong>{' '}
                    {m.away.name}
                  </span>
                  <span className="muted small">
                    {formatDate(m.date)}
                    {m.competition && ` · ${m.competition}`} ·{' '}
                    {s.finished ? 'Finalizado' : `En juego (set ${s.currentSetIndex + 1})`}
                  </span>
                </button>
                <button className="btn ghost danger" onClick={() => handleDelete(m.id, label)}>
                  Borrar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
