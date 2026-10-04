/**
 * Carga un partido, calcula su estado y lo guarda automáticamente después de
 * CADA cambio (para no perder datos si se cierra la ventana).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { nowIso } from '../../domain/ids';
import { computeMatchState } from '../../domain/match-state';
import type { Match, MatchEvent } from '../../domain/types';
import { getMatch, saveMatch } from '../../storage/repository';

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(() => getMatch(matchId));
  const [saveError, setSaveError] = useState<string | null>(null);
  // Copia siempre actualizada, para registrar varias acciones seguidas sin esperar a React.
  const matchRef = useRef(match);

  const commit = useCallback((update: (m: Match) => Match) => {
    const current = matchRef.current;
    if (!current) return;
    const next = { ...update(current), updatedAt: nowIso() };
    matchRef.current = next;
    setMatch(next);
    try {
      saveMatch(next);
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const addEvent = useCallback(
    (event: MatchEvent) => commit((m) => ({ ...m, events: [...m.events, event] })),
    [commit],
  );

  const removeEvent = useCallback(
    (id: string) => commit((m) => ({ ...m, events: m.events.filter((e) => e.id !== id) })),
    [commit],
  );

  const undoLast = useCallback(() => commit((m) => ({ ...m, events: m.events.slice(0, -1) })), [commit]);

  const state = useMemo(() => (match ? computeMatchState(match) : null), [match]);

  return { match, state, addEvent, removeEvent, undoLast, saveError, getLatest: () => matchRef.current };
}
