/** Textos legibles para mostrar eventos y códigos en la interfaz. */
import type { ParsedCode } from '../domain/code-parser';
import type { RallyWarning } from '../domain/match-state';
import { SUBSTITUTIONS_PER_SET, TIMEOUTS_PER_SET } from '../domain/match-state';
import { QUALITY_LABELS, SKILL_LABELS } from '../domain/skills';
import type { Match, MatchEvent, TeamSide } from '../domain/types';
import { routeLabel } from '../domain/zones';

export function playerLabel(match: Match, side: TeamSide, number: number): string {
  const p = match[side].players.find((x) => x.number === number);
  return p?.name ? `#${number} ${p.name}` : `#${number}`;
}

export function describeCode(match: Match, code: ParsedCode): string {
  const team = match[code.team].name;
  switch (code.kind) {
    case 'point':
      return `Punto para ${team}`;
    case 'timeout':
      return `Tiempo muerto · ${team}`;
    case 'serve':
      return `Saque para ${team} (indicado a mano)`;
    case 'substitution':
      return `${team} · Cambio: sale ${playerLabel(match, code.team, code.playerOut)}, entra ${playerLabel(
        match,
        code.team,
        code.playerIn,
      )}`;
    case 'action': {
      const skill = SKILL_LABELS[code.skill];
      const quality = QUALITY_LABELS[code.skill][code.quality];
      const route = routeLabel(code.startZone, code.endZone);
      return `${team} · ${playerLabel(match, code.team, code.playerNumber)} · ${skill}: ${quality}${
        route ? ` (${route})` : ''
      }`;
    }
    case 'lineup':
      return `Formación ${team}: ${code.positions.map((n, i) => `P${i + 1} #${n}`).join(' · ')}`;
  }
}

/** Convierte un evento guardado en la misma forma que un código, para describirlo. */
export function eventToCode(event: MatchEvent): ParsedCode {
  switch (event.type) {
    case 'action':
      return {
        kind: 'action',
        team: event.team,
        playerNumber: event.playerNumber,
        skill: event.skill,
        quality: event.quality,
        ...(event.startZone ? { startZone: event.startZone } : {}),
        ...(event.endZone ? { endZone: event.endZone } : {}),
      };
    case 'substitution':
      return { kind: 'substitution', team: event.team, playerOut: event.playerOut, playerIn: event.playerIn };
    case 'lineup':
      return { kind: 'lineup', team: event.team, positions: [...event.positions] };
    case 'point':
    case 'timeout':
    case 'serve':
      return { kind: event.type, team: event.team };
  }
}

export function describeEvent(match: Match, event: MatchEvent): string {
  return describeCode(match, eventToCode(event));
}

/** Código corto de un evento, al estilo Data Volley ("*7A#", "a12R+", "*T"). */
export function eventCode(event: MatchEvent): string {
  const prefix = event.team === 'home' ? '*' : 'a';
  switch (event.type) {
    case 'point':
      return `${prefix}p`;
    case 'timeout':
      return `${prefix}T`;
    case 'serve':
      return `${prefix}saque`;
    case 'substitution':
      return `${prefix}c${event.playerOut}:${event.playerIn}`;
    case 'action':
      // Las zonas van al final; si solo hay destino, el origen se marca con "~" (como Data Volley).
      return `${prefix}${event.playerNumber}${event.skill}${event.quality}${
        event.startZone ?? (event.endZone ? '~' : '')
      }${event.endZone ?? ''}`;
    case 'lineup':
      return `${prefix}formación`;
  }
}

export const WARNING_LABELS: Record<RallyWarning, string> = {
  'serve-wrong-team': 'Saca el equipo que no tenía el saque',
  'rally-not-closed': 'El rally anterior no terminó en punto',
  'reception-by-server': 'Recibe el mismo equipo que saca',
  'timeout-limit': `Más de ${TIMEOUTS_PER_SET} tiempos muertos en el set`,
  'substitution-limit': `Más de ${SUBSTITUTIONS_PER_SET} cambios en el set`,
  'wrong-server': 'Saca un jugador que no está en la posición 1',
  'player-not-on-court': 'El jugador no está en cancha según la formación',
  'sub-not-on-court': 'El jugador que sale no estaba en cancha',
  'sub-already-on-court': 'El jugador que entra ya estaba en cancha',
  'libero-substitution': 'Las entradas del líbero no se registran como cambio (no cuenta)',
};

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
