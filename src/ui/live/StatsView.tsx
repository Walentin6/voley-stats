/**
 * Estadísticas del partido, organizadas como el informe de Data Volley.
 * Fórmulas en docs/06-estadisticas.md.
 */
import { useState, type ReactNode } from 'react';
import type { MatchState } from '../../domain/match-state';
import {
  attackEfficiency,
  attackKill,
  breakPointPct,
  formatPct,
  receptionPerfect,
  receptionPositive,
  serveEfficiency,
  servePositive,
  sideOutPct,
} from '../../domain/metrics';
import {
  computeAttackPhases,
  computeErrorBreakdown,
  computeSetSummaries,
  computeSideOutByReception,
} from '../../domain/report';
import { QUALITY_LABELS } from '../../domain/skills';
import {
  computeTeamStats,
  type PlayerStats,
  type RotationStats,
  type SetFilter,
  type SkillStats,
  type StatLine,
} from '../../domain/stats';
import type { Match, TeamSide } from '../../domain/types';

interface Props {
  match: Match;
  state: MatchState;
}

interface TeamProps extends Props {
  side: TeamSide;
  filter: SetFilter;
}

const ratio = (a: number, b: number) => (b === 0 ? null : a / b);

function Section({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="stats-section">
      <h3>{title}</h3>
      {children}
      {note && <p className="small muted">{note}</p>}
    </section>
  );
}

function Kpi({ label, value, detail }: { label: string; value: ReactNode; detail: ReactNode }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className="kpi-detail">{detail}</span>
    </div>
  );
}

/** Saldo con signo: +3, 0, −2 (en rojo si es negativo). */
function Balance({ value }: { value: number }) {
  return <span className={value < 0 ? 'error' : ''}>{value > 0 ? `+${value}` : value}</span>;
}

// ---------------------------------------------------------------------------
// Tabla de jugadores (columnas del informe de Data Volley)
// ---------------------------------------------------------------------------

function PlayerCells({ line, sets }: { line: StatLine; sets: string }) {
  const { S, R, A, B, D, E, F } = line.skills;
  return (
    <>
      <td className="sets-cell">{sets}</td>
      <td className="grp strong">{line.points}</td>
      <td>{line.breakPointPoints}</td>
      <td>
        <Balance value={line.points - line.errors} />
      </td>
      <td className="grp">{S.total}</td>
      <td>{S.counts['=']}</td>
      <td>{S.counts['#']}</td>
      <td>{formatPct(servePositive(S))}</td>
      <td>{formatPct(serveEfficiency(S))}</td>
      <td className="grp">{R.total}</td>
      <td>{R.counts['=']}</td>
      <td>{formatPct(receptionPositive(R))}</td>
      <td>{formatPct(receptionPerfect(R))}</td>
      <td className="grp">{A.total}</td>
      <td>{A.counts['=']}</td>
      <td>{A.counts['/']}</td>
      <td>{A.counts['#']}</td>
      <td>{formatPct(attackKill(A))}</td>
      <td>{formatPct(attackEfficiency(A))}</td>
      <td className="grp">{B.counts['#']}</td>
      <td className="grp">{D.total ? `${D.total}/${D.counts['=']}` : ''}</td>
      <td>{F.total ? `${F.total}/${F.counts['=']}` : ''}</td>
      <td>{E.total ? `${E.total}/${E.counts['=']}` : ''}</td>
    </>
  );
}

function PlayersTable({ players, totals }: { players: PlayerStats[]; totals: StatLine }) {
  const setsLabel = (p: PlayerStats) => p.sets.map((s) => s + 1).join(' ');
  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr>
            <th rowSpan={2}>Jugador</th>
            <th rowSpan={2} title="Sets jugados">Sets</th>
            <th colSpan={3} className="grp">Puntos</th>
            <th colSpan={5} className="grp">Saque</th>
            <th colSpan={4} className="grp">Recepción</th>
            <th colSpan={6} className="grp">Ataque</th>
            <th className="grp">Bloq.</th>
            <th colSpan={3} className="grp" title="Total / errores">Otros (tot/err)</th>
          </tr>
          <tr>
            <th className="grp" title="Puntos propios: aces + ataques punto + bloqueos punto">Tot</th>
            <th title="Puntos ganados mientras el equipo sacaba">BP</th>
            <th title="Puntos − errores que dieron punto al rival">V-P</th>
            <th className="grp">Tot</th>
            <th>Err</th>
            <th>Ace</th>
            <th title="(# + + + /) / total">Pos%</th>
            <th title="(aces − errores) / total">Ef%</th>
            <th className="grp">Tot</th>
            <th>Err</th>
            <th title="(# + +) / total">Pos%</th>
            <th title="# / total">Perf%</th>
            <th className="grp">Tot</th>
            <th>Err</th>
            <th title="Ataques bloqueados">Bloq</th>
            <th>Pts</th>
            <th title="Puntos / total">Pts%</th>
            <th title="(puntos − errores − bloqueados) / total">Ef%</th>
            <th className="grp">Pts</th>
            <th className="grp">Def</th>
            <th>FB</th>
            <th>Arm</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.playerNumber} className={p.sets.length === 0 ? 'did-not-play' : ''}>
              <td className="player-cell">
                <strong>{p.playerNumber}</strong> {p.name}
              </td>
              <PlayerCells line={p} sets={setsLabel(p)} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="player-cell">Equipo</td>
            <PlayerCells line={totals} sets="" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resumen por set
// ---------------------------------------------------------------------------

function SetsTable({ match, state, side }: Omit<TeamProps, 'filter'>) {
  const rows = computeSetSummaries(match, state, side);
  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Set</th>
            <th className="grp">Marcador</th>
            <th>Duración</th>
            <th className="grp" title="Puntos de saque">Ace</th>
            <th>Ataque</th>
            <th>Bloqueo</th>
            <th title="Puntos por errores del rival o asignados a mano">Err. rival</th>
            <th className="grp">Side-out</th>
            <th>Break-point</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.setIndex}>
              <td className="player-cell">
                <strong>{r.setIndex + 1}</strong>
              </td>
              <td className={`grp strong ${r.own > r.opponent ? '' : 'muted'}`}>
                {r.own}-{r.opponent}
              </td>
              <td>{r.durationMinutes === null ? '–' : `${r.durationMinutes}′`}</td>
              <td className="grp">{r.aces}</td>
              <td>{r.attackPoints}</td>
              <td>{r.blockPoints}</td>
              <td>{r.opponentErrors}</td>
              <td className="grp">
                {formatPct(ratio(r.sideOuts, r.receiveRallies))}{' '}
                <span className="muted small">
                  ({r.sideOuts}/{r.receiveRallies})
                </span>
              </td>
              <td>
                {formatPct(ratio(r.breakPoints, r.serveRallies))}{' '}
                <span className="muted small">
                  ({r.breakPoints}/{r.serveRallies})
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ataque por fase
// ---------------------------------------------------------------------------

function AttackRow({ label, s, sub }: { label: string; s: SkillStats; sub?: boolean }) {
  return (
    <tr className={sub ? 'sub-row' : ''}>
      <td className="player-cell">{sub ? <span className="muted">↳ {label}</span> : <strong>{label}</strong>}</td>
      <td className="grp">{s.total}</td>
      <td>{s.counts['=']}</td>
      <td>{s.counts['/']}</td>
      <td>{s.counts['#']}</td>
      <td className="strong">{formatPct(attackKill(s))}</td>
      <td>{formatPct(attackEfficiency(s))}</td>
    </tr>
  );
}

function AttackPhasesTable({ match, state, side, filter }: TeamProps) {
  const p = computeAttackPhases(match, state, side, filter);
  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Fase</th>
            <th className="grp">Tot</th>
            <th>Err</th>
            <th>Bloq</th>
            <th>Pts</th>
            <th>Pts%</th>
            <th>Ef%</th>
          </tr>
        </thead>
        <tbody>
          <AttackRow label="Después de recepción (K1)" s={p.afterReception} />
          <AttackRow label="con recepción positiva (# +)" s={p.afterPositiveReception} sub />
          <AttackRow label="con recepción negativa (! - /)" s={p.afterNegativeReception} sub />
          <AttackRow label="Contraataque (K2)" s={p.transition} />
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side-out según la recepción
// ---------------------------------------------------------------------------

function SideOutByReceptionTable({ match, state, side, filter }: TeamProps) {
  const rows = computeSideOutByReception(match, state, side, filter);
  if (rows.length === 0) return <p className="muted small">Todavía no hay rallies recibiendo.</p>;
  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Recepción</th>
            <th className="grp">Rallies</th>
            <th>Ganados</th>
            <th>Side-out</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.quality ?? 'none'}>
              <td className="player-cell">
                {r.quality ? (
                  <>
                    <span className="code">{r.quality}</span> {QUALITY_LABELS.R[r.quality]}
                  </>
                ) : (
                  <span className="muted">Sin recepción cargada</span>
                )}
              </td>
              <td className="grp">{r.rallies}</td>
              <td>{r.won}</td>
              <td className="strong">{formatPct(ratio(r.won, r.rallies))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rotaciones
// ---------------------------------------------------------------------------

function RotationTable({ rows }: { rows: RotationStats[] }) {
  return (
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
                <td className="grp strong">
                  <Balance value={won - lost} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Puntos regalados
// ---------------------------------------------------------------------------

function ErrorsTable({ match, state, side, filter }: TeamProps) {
  const e = computeErrorBreakdown(match, state, side, filter);
  const rows: [string, number][] = [
    ['Saque (S=)', e.serve],
    ['Recepción (R=)', e.reception],
    ['Ataque (A=)', e.attack],
    ['Ataque bloqueado (A/)', e.blocked],
    ['Bloqueo (B= / B/)', e.block],
    ['Armado (E=)', e.set],
    ['Defensa (D=)', e.dig],
    ['Free ball (F=)', e.freeball],
    ['Otros (puntos manuales del rival)', e.other],
  ];
  return (
    <div className="table-scroll narrow">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Error</th>
            <th className="grp">Puntos</th>
            <th>% del total</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter(([, n]) => n > 0)
            .map(([label, n]) => (
              <tr key={label}>
                <td className="player-cell">{label}</td>
                <td className="grp strong">{n}</td>
                <td>{formatPct(ratio(n, e.total))}</td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="player-cell">Total</td>
            <td className="grp">{e.total}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vista completa de un equipo
// ---------------------------------------------------------------------------

function TeamReport({ match, state, side, filter }: TeamProps) {
  const stats = computeTeamStats(match, state, side, filter);
  const errors = computeErrorBreakdown(match, state, side, filter);
  const props = { match, state, side, filter };

  return (
    <div className="team-report">
      <div className="team-summary">
        <Kpi
          label="Puntos ganados"
          value={stats.pointsWon}
          detail={`${stats.totals.points} propios · ${stats.pointsFromOpponent} por errores del rival`}
        />
        <Kpi
          label="Side-out"
          value={formatPct(sideOutPct(stats))}
          detail={`${stats.sideOuts} de ${stats.receiveRallies} recibiendo`}
        />
        <Kpi
          label="Break-point"
          value={formatPct(breakPointPct(stats))}
          detail={`${stats.breakPoints} de ${stats.serveRallies} sacando`}
        />
        <Kpi label="Puntos regalados" value={errors.total} detail="errores que dieron punto al rival" />
      </div>

      <Section
        title="Jugadores"
        note="Sets = sets jugados · BP = puntos ganados sacando · V-P = puntos − errores · Otros = total/errores de defensa, free ball y armado. Un saque seguido de un error de recepción del rival cuenta como ace."
      >
        <PlayersTable players={stats.players} totals={stats.totals} />
      </Section>

      {filter === 'all' && (
        <Section title="Por set" note="Duración = tiempo entre la primera y la última acción registrada del set.">
          <SetsTable match={match} state={state} side={side} />
        </Section>
      )}

      <Section
        title="Ataque por fase"
        note="K1 = primer ataque después de recibir el saque, antes de que el rival toque la pelota. K2 = cualquier otro ataque (contraataque o transición)."
      >
        <AttackPhasesTable {...props} />
      </Section>

      <Section
        title="Side-out según la recepción"
        note="Qué porcentaje de los rallies en los que el equipo recibe termina ganando, según la calidad de la recepción."
      >
        <SideOutByReceptionTable {...props} />
      </Section>

      {stats.rotations.length > 0 && (
        <Section
          title="Por rotación"
          note="P1–P6 = posición del armador (R1–R6 si la plantilla no marca a nadie como armador). Saldo = puntos ganados − perdidos. Solo rallies con formación cargada."
        >
          <RotationTable rows={stats.rotations} />
        </Section>
      )}

      <Section title="Puntos regalados">
        {errors.total === 0 ? <p className="muted small">Sin errores.</p> : <ErrorsTable {...props} />}
      </Section>
    </div>
  );
}

export function StatsView({ match, state }: Props) {
  const [filter, setFilter] = useState<SetFilter>('all');
  const [side, setSide] = useState<TeamSide>('home');

  return (
    <div className="stats">
      <div className="stats-controls">
        <div className="segmented" role="tablist" aria-label="Equipo">
          {(['home', 'away'] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={side === s}
              className={`chip ${s} ${side === s ? 'selected' : ''}`}
              onClick={() => setSide(s)}
            >
              {match[s].name}
            </button>
          ))}
        </div>
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
      </div>

      <TeamReport match={match} state={state} side={side} filter={filter} />
    </div>
  );
}
