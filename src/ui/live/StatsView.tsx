/** Tablas de estadísticas por jugador. Fórmulas en docs/06-estadisticas.md. */
import { useState } from 'react';
import type { MatchState } from '../../domain/match-state';
import {
  attackEfficiency,
  attackKill,
  breakPointPct,
  formatPct,
  sideOutPct,
  receptionPerfect,
  receptionPositive,
  serveEfficiency,
  servePositive,
} from '../../domain/metrics';
import { computeTeamStats, type RotationStats, type SetFilter, type StatLine } from '../../domain/stats';
import type { Match, TeamSide } from '../../domain/types';

interface Props {
  match: Match;
  state: MatchState;
}

function Cells({ line }: { line: StatLine }) {
  const { S, R, A, B, D, E, F } = line.skills;
  return (
    <>
      <td className="strong">{line.points}</td>
      <td className="grp">{S.total}</td>
      <td>{S.counts['#']}</td>
      <td>{S.counts['=']}</td>
      <td>{formatPct(servePositive(S))}</td>
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
      <td className="grp">{F.total}</td>
      <td>{F.counts['=']}</td>
      <td className="grp">{E.total}</td>
      <td>{E.counts['=']}</td>
    </>
  );
}

/** Side-out y break-point en cada rotación (solo rallies con formación cargada). */
function RotationTable({ rows }: { rows: RotationStats[] }) {
  return (
    <>
      <h4 className="rotation-heading">Por rotación</h4>
      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Rotación</th>
              <th className="grp">Side-out</th>
              <th>Ganados / recibiendo</th>
              <th className="grp">Break-point</th>
              <th>Ganados / sacando</th>
              <th className="grp">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const won = r.sideOuts + r.breakPoints;
              const lost = r.receiveRallies + r.serveRallies - won;
              return (
                <tr key={r.label}>
                  <td className="player-cell">
                    <strong>{r.label}</strong>
                  </td>
                  <td className="grp strong">{formatPct(sideOutPct(r))}</td>
                  <td>
                    {r.sideOuts} / {r.receiveRallies}
                  </td>
                  <td className="grp strong">{formatPct(breakPointPct(r))}</td>
                  <td>
                    {r.breakPoints} / {r.serveRallies}
                  </td>
                  <td className={`grp strong ${won - lost < 0 ? 'error' : ''}`}>
                    {won - lost > 0 ? `+${won - lost}` : won - lost}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small muted">
        P1–P6 = posición del armador (R1–R6 si la plantilla no marca a nadie como armador: rotaciones contadas
        desde la formación). Saldo = puntos ganados − perdidos en esa rotación.
      </p>
    </>
  );
}

function TeamTable({ match, state, side, filter }: Props & { side: TeamSide; filter: SetFilter }) {
  const stats = computeTeamStats(match, state, side, filter);
  return (
    <section className="stats-team">
      <h3 className={`team-heading ${side}`}>{match[side].name}</h3>
      <div className="team-summary">
        <div className="kpi">
          <span className="kpi-label">Puntos ganados</span>
          <span className="kpi-value">{stats.pointsWon}</span>
          <span className="kpi-detail">
            {stats.totals.points} propios · {stats.pointsFromOpponent} por errores del rival
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Side-out</span>
          <span className="kpi-value">{formatPct(sideOutPct(stats))}</span>
          <span className="kpi-detail">
            {stats.sideOuts} de {stats.receiveRallies} recibiendo
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Break-point</span>
          <span className="kpi-value">{formatPct(breakPointPct(stats))}</span>
          <span className="kpi-detail">
            {stats.breakPoints} de {stats.serveRallies} sacando
          </span>
        </div>
      </div>
      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th rowSpan={2}>Jugador</th>
              <th rowSpan={2}>Pts</th>
              <th colSpan={5} className="grp">Saque</th>
              <th colSpan={4} className="grp">Recepción</th>
              <th colSpan={6} className="grp">Ataque</th>
              <th className="grp">Bloq.</th>
              <th colSpan={2} className="grp">Defensa</th>
              <th colSpan={2} className="grp">Free ball</th>
              <th colSpan={2} className="grp">Armado</th>
            </tr>
            <tr>
              <th className="grp">Tot</th>
              <th>Ace</th>
              <th>Err</th>
              <th title="Saques positivos: (# + + + /) / total">Pos%</th>
              <th title="Eficacia: (aces − errores) / total">Ef%</th>
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
      {stats.rotations.length > 0 && <RotationTable rows={stats.rotations} />}
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
        Side-out = % de rallies ganados recibiendo · Break-point = % de rallies ganados sacando · Pos% saque = (# +
        + + /) / total · Ef% saque = (aces − errores) / total · Pos% recepción = (# + +) / total · Ef% ataque =
        (puntos − errores − bloqueados) / total. Un saque seguido de un error de recepción del rival cuenta como ace.
      </p>
    </div>
  );
}
