/** Tablas de estadísticas por jugador. Fórmulas en docs/06-estadisticas.md. */
import { useState } from 'react';
import type { MatchState } from '../../domain/match-state';
import {
  attackEfficiency,
  attackKill,
  formatPct,
  receptionPerfect,
  receptionPositive,
  serveEfficiency,
} from '../../domain/metrics';
import { computeTeamStats, type SetFilter, type StatLine } from '../../domain/stats';
import type { Match, TeamSide } from '../../domain/types';

interface Props {
  match: Match;
  state: MatchState;
}

function Cells({ line }: { line: StatLine }) {
  const { S, R, A, B, D, E } = line.skills;
  return (
    <>
      <td className="strong">{line.points}</td>
      <td className="grp">{S.total}</td>
      <td>{S.counts['#']}</td>
      <td>{S.counts['=']}</td>
      <td>{formatPct(serveEfficiency(S))}</td>
      <td className="grp">{R.total}</td>
      <td>{R.counts['=']}</td>
      <td>{formatPct(receptionPositive(R))}</td>
      <td>{formatPct(receptionPerfect(R))}</td>
      <td className="grp">{A.total}</td>
      <td>{A.counts['#']}</td>
      <td>{A.counts['=']}</td>
      <td>{A.counts['/']}</td>
      <td>{formatPct(attackKill(A))}</td>
      <td>{formatPct(attackEfficiency(A))}</td>
      <td className="grp">{B.counts['#']}</td>
      <td className="grp">{D.total}</td>
      <td>{D.counts['=']}</td>
      <td className="grp">{E.total}</td>
      <td>{E.counts['=']}</td>
    </>
  );
}

function TeamTable({ match, state, side, filter }: Props & { side: TeamSide; filter: SetFilter }) {
  const stats = computeTeamStats(match, state, side, filter);
  return (
    <section className="stats-team">
      <h3 className={`team-heading ${side}`}>{match[side].name}</h3>
      <p className="small muted">
        Puntos ganados: <strong>{stats.pointsWon}</strong> · Por acciones propias: {stats.totals.points} · Por
        errores del rival / manuales: {stats.pointsFromOpponent}
      </p>
      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th rowSpan={2}>Jugador</th>
              <th rowSpan={2}>Pts</th>
              <th colSpan={4} className="grp">Saque</th>
              <th colSpan={4} className="grp">Recepción</th>
              <th colSpan={6} className="grp">Ataque</th>
              <th className="grp">Bloq.</th>
              <th colSpan={2} className="grp">Defensa</th>
              <th colSpan={2} className="grp">Armado</th>
            </tr>
            <tr>
              <th className="grp">Tot</th>
              <th>Ace</th>
              <th>Err</th>
              <th>Ef%</th>
              <th className="grp">Tot</th>
              <th>Err</th>
              <th>Pos%</th>
              <th>Perf%</th>
              <th className="grp">Tot</th>
              <th>Pts</th>
              <th>Err</th>
              <th>Bloq</th>
              <th>Pts%</th>
              <th>Ef%</th>
              <th className="grp">Pts</th>
              <th className="grp">Tot</th>
              <th>Err</th>
              <th className="grp">Tot</th>
              <th>Err</th>
            </tr>
          </thead>
          <tbody>
            {stats.players.map((p) => (
              <tr key={p.playerNumber}>
                <td className="player-cell">
                  <strong>{p.playerNumber}</strong> {p.name}
                </td>
                <Cells line={p} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="player-cell">Equipo</td>
              <Cells line={stats.totals} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function StatsView({ match, state }: Props) {
  const [filter, setFilter] = useState<SetFilter>('all');
  return (
    <div className="stats">
      <label className="field inline">
        <span>Mostrar</span>
        <select
          value={String(filter)}
          onChange={(e) => setFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">Todo el partido</option>
          {state.sets.map((_, i) => (
            <option key={i} value={i}>
              Set {i + 1}
            </option>
          ))}
        </select>
      </label>
      <TeamTable match={match} state={state} side="home" filter={filter} />
      <TeamTable match={match} state={state} side="away" filter={filter} />
      <p className="small muted">
        Ef% saque = (aces − errores) / total · Pos% recepción = (# + +) / total · Ef% ataque = (puntos − errores −
        bloqueados) / total.
      </p>
    </div>
  );
}
