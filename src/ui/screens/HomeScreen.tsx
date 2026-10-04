import { useRef, useState } from 'react';
import { computeMatchState } from '../../domain/match-state';
import { parseMatchJson } from '../../storage/import';
import { deleteMatch, getMatch, listMatches, listTeams, saveMatch } from '../../storage/repository';
import { Page } from '../components/Page';
import { formatDate } from '../format';
import type { Navigate } from '../navigation';

export function HomeScreen({ navigate }: { navigate: Navigate }) {
  const [matches, setMatches] = useState(() => listMatches());
  const teamCount = listTeams().length;

  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleDelete(id: string, label: string) {
    if (!confirm(`¿Borrar el partido ${label}? No se puede deshacer.`)) return;
    deleteMatch(id);
    setMatches(listMatches());
  }

  async function handleImport(file: File) {
    setImportError(null);
    const result = parseMatchJson(await file.text());
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    const { match } = result;
    if (getMatch(match.id) && !confirm('Este partido ya está guardado. ¿Reemplazarlo con el del archivo?')) return;
    try {
      saveMatch(match);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
      return;
    }
    navigate({ name: 'match', matchId: match.id });
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
        <div className="button-row">
          <button className="btn" onClick={() => fileInput.current?.click()}>
            Importar
          </button>
          <button className="btn primary" onClick={() => navigate({ name: 'new-match' })}>
            + Nuevo partido
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // permite volver a elegir el mismo archivo
            if (file) void handleImport(file);
          }}
        />
      </div>

      {importError && <p className="error">{importError}</p>}

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
