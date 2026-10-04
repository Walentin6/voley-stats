import { useState } from 'react';
import type { MatchState } from '../../domain/match-state';
import type { Match } from '../../domain/types';
import { describeEvent, eventCode, WARNING_LABELS } from '../format';

interface Props {
  match: Match;
  state: MatchState;
  onDelete: (id: string) => void;
}

const COLLAPSED = 15;

/** Historial de acciones, la más reciente arriba. Permite borrar cualquiera. */
export function EventLog({ match, state, onDelete }: Props) {
  const [showAll, setShowAll] = useState(false);
  const events = [...match.events].reverse();
  const visible = showAll ? events : events.slice(0, COLLAPSED);

  if (events.length === 0) {
    return <p className="muted">Todavía no hay acciones registradas.</p>;
  }

  return (
    <section aria-label="Historial">
      <h3>Historial ({events.length})</h3>
      <ol className="event-log">
        {visible.map((ev) => {
          const info = state.info[ev.id];
          const pointClass = info?.pointTo ? `point-${info.pointTo}` : '';
          const kindClass = ev.type === 'action' || ev.type === 'point' ? '' : 'event-meta';
          return (
            <li key={ev.id} className={`event ${pointClass} ${kindClass}`}>
              <span className="event-set small muted">S{(info?.setIndex ?? 0) + 1}</span>
              <span className="event-score">
                {info ? `${info.scoreAfter.home}-${info.scoreAfter.away}` : ''}
              </span>
              <code className="event-code">{eventCode(ev)}</code>
              <span className="event-desc">
                {describeEvent(match, ev)}
                {info?.mirrorOf && <em className="muted"> (mismo punto, no suma)</em>}
                {info?.afterEnd && <em className="muted"> (después del final)</em>}
                {info?.warnings.map((w) => (
                  <span key={w} className="event-warning small warn">
                    ⚠ {WARNING_LABELS[w]}
                  </span>
                ))}
              </span>
              <button
                className="btn ghost danger small"
                onClick={() => {
                  if (confirm(`¿Borrar "${describeEvent(match, ev)}"?`)) onDelete(ev.id);
                }}
                aria-label="Borrar acción"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ol>
      {events.length > COLLAPSED && (
        <button className="btn ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Ver menos' : `Ver todas (${events.length})`}
        </button>
      )}
    </section>
  );
}
