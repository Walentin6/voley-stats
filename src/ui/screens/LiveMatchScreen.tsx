import { useEffect, useRef, useState } from 'react';
import type { ParsedCode } from '../../domain/code-parser';
import { computeMatchState, needsTiebreakServeChoice, setHasPlay } from '../../domain/match-state';
import { eventFromCode } from '../../domain/factories';
import { lastLineup } from '../../domain/rotation';
import type { TeamSide } from '../../domain/types';
import { downloadJson, matchFilename } from '../../storage/export';
import { Page } from '../components/Page';
import { useMatch } from '../hooks/useMatch';
import { ActionPad } from '../live/ActionPad';
import { CodeInput } from '../live/CodeInput';
import { EventLog } from '../live/EventLog';
import { LineupEditor } from '../live/LineupEditor';
import { Scoreboard } from '../live/Scoreboard';
import { StatsView } from '../live/StatsView';
import type { Navigate } from '../navigation';

type Tab = 'entry' | 'stats';

/** true si el foco está en un campo de texto o un desplegable. */
function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('input, textarea, select') !== null;
}

export function LiveMatchScreen({ navigate, matchId }: { navigate: Navigate; matchId: string }) {
  const { match, state, addEvent, removeEvent, replaceEvent, undoLast, saveError, getLatest } = useMatch(matchId);
  const [tab, setTab] = useState<Tab>('entry');
  /** Equipo cuya formación se está editando con el botón "Formación". */
  const [editingLineup, setEditingLineup] = useState<TeamSide | null>(null);
  /** Set en el que se eligió "Seguir sin formación". */
  const [skippedLineupSet, setSkippedLineupSet] = useState<number | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const goHome = () => navigate({ name: 'home' });

  // Atajos de teclado (ver docs/07-guia-de-uso.md):
  // - Escribir cualquier letra o número lleva el foco al campo de códigos.
  // - Ctrl+Z deshace la última acción (si el campo de códigos está vacío).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const typing = isTypingTarget(e.target);
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        // Dentro de un campo con texto, Ctrl+Z deshace lo escrito (comportamiento normal).
        if (typing && (e.target as HTMLInputElement).value) return;
        e.preventDefault();
        undoLast();
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey || tab !== 'entry') return;
      if (e.key.length === 1) codeInputRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tab, undoLast]);

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
  const askTiebreakServe = needsTiebreakServeChoice(match, state);
  const entryDisabled = state.finished || askTiebreakServe;
  const chooseServe = (team: TeamSide) => record({ kind: 'serve', team });
  const setNumber = state.currentSetIndex + 1;

  // Formaciones: se proponen al empezar cada set (se puede omitir), y se pueden
  // abrir en cualquier momento con el botón "Formación" de cada equipo.
  const missingLineups = (['home', 'away'] as const).filter((side) => !state.courts[side]);
  const proposeLineups =
    tab === 'entry' &&
    !state.finished &&
    !setHasPlay(match, state) &&
    skippedLineupSet !== state.currentSetIndex &&
    missingLineups.length > 0;
  const lineupsToShow: TeamSide[] = editingLineup ? [editingLineup] : proposeLineups ? missingLineups : [];

  function saveLineup(team: TeamSide, positions: number[]) {
    record({ kind: 'lineup', team, positions });
    setEditingLineup(null);
  }

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
      {askTiebreakServe && (
        <div className="notice prompt">
          <p>
            <strong>Set decisivo.</strong> Según el sorteo, ¿quién saca primero?
          </p>
          <div className="prompt-actions">
            <button className="btn primary" onClick={() => chooseServe('home')}>
              Saca {match.home.name}
            </button>
            <button className="btn primary" onClick={() => chooseServe('away')}>
              Saca {match.away.name}
            </button>
          </div>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'entry'} className="tab" onClick={() => setTab('entry')}>
          Carga
        </button>
        <button role="tab" aria-selected={tab === 'stats'} className="tab" onClick={() => setTab('stats')}>
          Estadísticas
        </button>
      </div>

      {lineupsToShow.length > 0 && (
        <section className="lineups" aria-label="Formaciones">
          <div className="row-between">
            <h3>{editingLineup ? 'Formación' : `Formación del set ${setNumber}`}</h3>
            {!editingLineup && (
              <button className="btn ghost" onClick={() => setSkippedLineupSet(state.currentSetIndex)}>
                Seguir sin formación
              </button>
            )}
          </div>
          {!editingLineup && (
            <p className="small muted">
              Opcional. Con la formación, la app rota sola, sabe quién saca y calcula estadísticas por rotación.
            </p>
          )}
          <div className="lineup-list">
            {lineupsToShow.map((side) => (
              <LineupEditor
                key={`${side}-${state.currentSetIndex}`}
                match={match}
                team={side}
                title={match[side].name}
                initial={state.courts[side]?.positions ?? lastLineup(match, side)}
                onSave={(positions) => saveLineup(side, positions)}
                onCancel={editingLineup ? () => setEditingLineup(null) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {tab === 'entry' ? (
        <>
          <CodeInput match={match} disabled={entryDisabled} onRecord={record} inputRef={codeInputRef} />
          <ActionPad
            match={match}
            state={state}
            disabled={entryDisabled}
            onRecord={record}
            onUndo={undoLast}
            onEditLineup={(side) => setEditingLineup(side)}
          />
          <EventLog match={match} state={state} onDelete={removeEvent} onReplace={replaceEvent} />
        </>
      ) : (
        <StatsView match={match} state={state} />
      )}
    </Page>
  );
}
