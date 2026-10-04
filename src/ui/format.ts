/** Textos legibles para mostrar eventos y códigos en la interfaz. */
import type { ParsedCode } from '../domain/code-parser';
import { QUALITY_LABELS, SKILL_LABELS } from '../domain/skills';
import type { Match, MatchEvent, TeamSide } from '../domain/types';

export function playerLabel(match: Match, side: TeamSide, number: number): string {
  const p = match[side].players.find((x) => x.number === number);
  return p?.name ? `#${number} ${p.name}` : `#${number}`;
}

export function describeCode(match: Match, code: ParsedCode): string {
  const team = match[code.team].name;
  if (code.kind === 'point') return `Punto para ${team}`;
  const skill = SKILL_LABELS[code.skill];
  const quality = QUALITY_LABELS[code.skill][code.quality];
  return `${team} · ${playerLabel(match, code.team, code.playerNumber)} · ${skill}: ${quality}`;
}

export function describeEvent(match: Match, event: MatchEvent): string {
  if (event.type === 'point') return describeCode(match, { kind: 'point', team: event.team });
  return describeCode(match, { kind: 'action', ...event });
}

/** Código corto de un evento, al estilo Data Volley ("*7A#", "a12R+"). */
export function eventCode(event: MatchEvent): string {
  const prefix = event.team === 'home' ? '*' : 'a';
  if (event.type === 'point') return `${prefix}p`;
  return `${prefix}${event.playerNumber}${event.skill}${event.quality}`;
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
