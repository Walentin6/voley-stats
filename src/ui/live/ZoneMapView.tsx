/**
 * Mapa de dirección de saques o ataques: líneas desde la zona de origen (cancha
 * propia, siempre a la izquierda) hasta la zona de destino (cancha rival).
 * Verde = punto, rojo = error, gris = el rally siguió.
 */
import { useState } from 'react';
import type { MatchState } from '../../domain/match-state';
import { computeZoneMap, type RouteOutcome } from '../../domain/report';
import type { SetFilter } from '../../domain/stats';
import type { Match, TeamSide } from '../../domain/types';
import { otherSide } from '../../domain/types';
import { ZONES, type Zone } from '../../domain/zones';
import { Court } from '../court/Court';
import { zoneCenter } from '../court/geometry';

interface Props {
  match: Match;
  state: MatchState;
  side: TeamSide;
  filter: SetFilter;
}

const OUTCOME_OFFSET: Record<RouteOutcome, number> = { point: -2.5, other: 0, error: 2.5 };
const OUTCOME_LABEL: Record<RouteOutcome, string> = { point: 'Punto', other: 'Sigue el rally', error: 'Error' };

export function ZoneMapView({ match, state, side, filter }: Props) {
  const [skill, setSkill] = useState<'S' | 'A'>('A');
  const [player, setPlayer] = useState<number | null>(null);
  const map = computeZoneMap(match, state, side, skill, filter, player);
  const opponent = otherSide(side);
  const maxEnd = Math.max(1, ...Object.values(map.endCounts).map((n) => n ?? 0));
  const endTotal = Object.values(map.endCounts).reduce((a: number, n) => a + (n ?? 0), 0);

  const zoneText = (counts: Partial<Record<Zone, number>>, total: number) =>
    Object.fromEntries(
      ZONES.map((z) => [z, counts[z] ? `${counts[z]} (${Math.round(((counts[z] ?? 0) / total) * 100)}%)` : '']),
    ) as Partial<Record<Zone, string>>;
  const startTotal = Object.values(map.startCounts).reduce((a: number, n) => a + (n ?? 0), 0);

  return (
    <div className="zone-map">
      <div className="stats-controls">
        <div className="segmented">
          {(['S', 'A'] as const).map((s) => (
            <button key={s} className={`chip ${skill === s ? 'selected' : ''}`} onClick={() => setSkill(s)}>
              {s === 'S' ? 'Saque' : 'Ataque'}
            </button>
          ))}
        </div>
        <label className="field inline">
          <span>Jugador</span>
          <select value={player ?? ''} onChange={(e) => setPlayer(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Todos</option>
            {[...match[side].players]
              .sort((a, b) => a.number - b.number)
              .map((p) => (
                <option key={p.id} value={p.number}>
                  #{p.number} {p.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      {map.withZones === 0 ? (
        <p className="muted small">
          No hay {skill === 'S' ? 'saques' : 'ataques'} con zonas cargadas. Activa "Zonas" en la carga o escribe las
          zonas al final del código (ej. 7A#47).
        </p>
      ) : (
        <>
          <Court
            ariaLabel={`Mapa de ${skill === 'S' ? 'saques' : 'ataques'}`}
            left={{
              label: `${match[side].name} (origen)`,
              tone: side,
              zoneText: zoneText(map.startCounts, startTotal),
            }}
            right={{
              label: `${match[opponent].name} (destino)`,
              tone: opponent,
              zoneText: zoneText(map.endCounts, endTotal),
              zoneHeat: Object.fromEntries(
                ZONES.map((z) => [z, ((map.endCounts[z] ?? 0) / maxEnd) * 0.55]),
              ) as Partial<Record<Zone, number>>,
            }}
          >
            <defs>
              {(['point', 'other', 'error'] as const).map((o) => (
                <marker
                  key={o}
                  id={`arrow-${o}`}
                  viewBox="0 0 6 6"
                  refX="5"
                  refY="3"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L6,3 L0,6 z" className={`route-arrow ${o}`} />
                </marker>
              ))}
            </defs>
            {map.routes
              .filter((r) => r.start !== null)
              .map((r) => {
                const from = zoneCenter('left', r.start!);
                const to = zoneCenter('right', r.end);
                const dy = OUTCOME_OFFSET[r.outcome];
                return (
                  <line
                    key={`${r.start}-${r.end}-${r.outcome}`}
                    x1={from.x}
                    y1={from.y + dy}
                    x2={to.x}
                    y2={to.y + dy}
                    className={`route ${r.outcome}`}
                    strokeWidth={Math.min(0.8 + r.count * 0.6, 5)}
                    markerEnd={`url(#arrow-${r.outcome})`}
                  >
                    <title>
                      {`${r.start}→${r.end}: ${r.count} · ${OUTCOME_LABEL[r.outcome]}`}
                    </title>
                  </line>
                );
              })}
          </Court>
          <div className="map-legend small">
            <span className="legend-item point">Punto</span>
            <span className="legend-item error">Error</span>
            <span className="legend-item other">Sigue el rally</span>
            <span className="muted">
              · {map.withZones} de {map.total} {skill === 'S' ? 'saques' : 'ataques'} con zonas. Las zonas de destino
              más oscuras recibieron más pelotas.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
