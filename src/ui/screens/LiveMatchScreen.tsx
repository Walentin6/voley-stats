import { useState } from 'react';
import type { ParsedCode } from '../../domain/code-parser';
import { computeMatchState } from '../../domain/match-state';
import { eventFromCode } from '../../domain/factories';
import { downloadJson, matchFilename } from '../../storage/export';
import { Page } from '../components/Page';
import { useMatch } from '../hooks/useMatch';
import { ActionPad } from '../live/ActionPad';
import { CodeInput } from '../live/CodeInput';
import { EventLog } from '../live/EventLog';
import { Scoreboard } from '../live/Scoreboard';
import { StatsView } from '../live/StatsView';
import type { Navigate } from '../navigation';

type Tab = 'entry' | 'stats';

export function LiveMatchScreen({ navigate, matchId }: { navigate: Navigate; matchId: string }) {
  const { match, state, addEvent, removeEvent, undoLast, saveError, getLatest } = useMatch(matchId);
  const [tab, setTab] = useState<Tab>('entry');
  const goHome = () => navigate({ name: 'home' });

  if (!match || !state) {
    return (
      <Page title="Partido" onBack={goHome}>
        <p className="error">No se encontró el partido.</p>
      </Page>
    );
  }

  function record(code: ParsedCode) {
    // Se consulta el estado más reciente: al cargar varios códigos juntos,
    // el partido puede terminar en medio de la lista.
    const latest = getLatest();
    if (!latest || computeMatchState(latest).finished) return;
    addEvent(eventFromCode(code));
  }

  const winnerName = state.winner ? match[state.winner].name : '';

  return (
    <Page
      wide
      title={`${match.home.name} vs ${match.away.name}`}
      onBack={goHome}
      actions={
        <button className="btn ghost" onClick={() => downloadJson(matchFilename(match), match)}>
          Exportar
        </button>
      }
    >
      <Scoreboard match={match} state={state} />

      {saveError && <p className="error">{saveError}</p>}
      {state.finished && (
        <p className="notice">
          Partido terminado: ganó <strong>{winnerName}</strong> {state.setsWon.home}-{state.setsWon.away}. Si hubo
          un error, puedes deshacer o borrar acciones del historial.
        </p>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'entry'} className="tab" onClick={() => setTab('entry')}>
          Carga
        </button>
        <button role="tab" aria-selected={tab === 'stats'} className="tab" onClick={() => setTab('stats')}>
          Estadísticas
        </button>
      </div>

      {tab === 'entry' ? (
        <>
          <CodeInput match={match} disabled={state.finished} onRecord={record} />
          <ActionPad match={match} state={state} disabled={state.finished} onRecord={record} onUndo={undoLast} />
          <EventLog match={match} state={state} onDelete={removeEvent} />
        </>
      ) : (
        <StatsView match={match} state={state} />
      )}
    </Page>
  );
}
