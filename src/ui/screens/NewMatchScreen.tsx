import { useState } from 'react';
import { createMatch, DEFAULT_SETTINGS } from '../../domain/factories';
import type { MatchSettings, TeamSide } from '../../domain/types';
import { listTeams, saveMatch } from '../../storage/repository';
import { Page } from '../components/Page';
import { todayIso } from '../format';
import type { Navigate } from '../navigation';

export function NewMatchScreen({ navigate }: { navigate: Navigate }) {
  const [teams] = useState(() => listTeams());
  const [homeId, setHomeId] = useState(teams[0]?.id ?? '');
  const [awayId, setAwayId] = useState(teams[1]?.id ?? '');
  const [date, setDate] = useState(todayIso());
  const [competition, setCompetition] = useState('');
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof MatchSettings>(key: K, value: MatchSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  function handleCreate() {
    const home = teams.find((t) => t.id === homeId);
    const away = teams.find((t) => t.id === awayId);
    if (!home || !away) return setError('Elige los dos equipos.');
    if (home.id === away.id) return setError('El local y el visitante deben ser equipos distintos.');
    if (home.players.length === 0 || away.players.length === 0) {
      return setError('Los dos equipos necesitan al menos un jugador.');
    }
    if (settings.pointsPerSet < 1 || settings.pointsTiebreak < 1) {
      return setError('Los puntos por set deben ser mayores que 0.');
    }
    const match = createMatch({ date, competition: competition.trim(), home, away, settings });
    saveMatch(match);
    navigate({ name: 'match', matchId: match.id });
  }

  if (teams.length < 2) {
    return (
      <Page title="Nuevo partido" onBack={() => navigate({ name: 'home' })}>
        <p className="notice">Necesitas al menos dos equipos guardados para crear un partido.</p>
        <button className="btn primary" onClick={() => navigate({ name: 'teams' })}>
          Ir a Equipos
        </button>
      </Page>
    );
  }

  const teamOptions = teams.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name} ({t.players.length})
    </option>
  ));

  return (
    <Page title="Nuevo partido" onBack={() => navigate({ name: 'home' })}>
      <div className="form-grid">
        <label className="field">
          <span>Local</span>
          <select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
            {teamOptions}
          </select>
        </label>
        <label className="field">
          <span>Visitante</span>
          <select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
            {teamOptions}
          </select>
        </label>
        <label className="field">
          <span>Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Competición (opcional)</span>
          <input value={competition} onChange={(e) => setCompetition(e.target.value)} placeholder="Liga, torneo..." />
        </label>
        <label className="field">
          <span>Formato</span>
          <select value={settings.bestOf} onChange={(e) => set('bestOf', Number(e.target.value) as 3 | 5)}>
            <option value={5}>Al mejor de 5 sets</option>
            <option value={3}>Al mejor de 3 sets</option>
          </select>
        </label>
        <label className="field">
          <span>Saca primero</span>
          <select value={settings.firstServe} onChange={(e) => set('firstServe', e.target.value as TeamSide)}>
            <option value="home">Local</option>
            <option value="away">Visitante</option>
          </select>
        </label>
        <label className="field">
          <span>Puntos por set</span>
          <input
            type="number"
            min={1}
            value={settings.pointsPerSet}
            onChange={(e) => set('pointsPerSet', Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Puntos del set decisivo</span>
          <input
            type="number"
            min={1}
            value={settings.pointsTiebreak}
            onChange={(e) => set('pointsTiebreak', Number(e.target.value))}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn primary big" onClick={handleCreate}>
        Empezar partido
      </button>
    </Page>
  );
}
