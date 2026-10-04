import type { MatchState } from '../../domain/match-state';
import type { Match, TeamSide } from '../../domain/types';

interface Props {
  match: Match;
  state: MatchState;
}

export function Scoreboard({ match, state }: Props) {
  const current = state.sets[state.currentSetIndex]!;

  const side = (s: TeamSide) => (
    <div className={`score-side ${s}`}>
      <div className="score-name">
        {state.serving === s && !state.finished && (
          <span className="serve-dot" title="Saca" aria-label="Saca" />
        )}
        {match[s].name}
      </div>
      <div className="score-row">
        <span className="score-sets" title="Sets ganados">
          {state.setsWon[s]}
        </span>
        <span className="score-points">{current[s]}</span>
      </div>
    </div>
  );

  return (
    <section className="scoreboard" aria-label="Marcador">
      {side('home')}
      <div className="score-middle">
        <span className="muted small">{state.finished ? 'Final' : `Set ${state.currentSetIndex + 1}`}</span>
        <div className="set-history">
          {state.sets
            .filter((x) => x.winner)
            .map((x, i) => (
              <span key={i} className="small">
                {x.home}-{x.away}
              </span>
            ))}
        </div>
      </div>
      {side('away')}
    </section>
  );
}
