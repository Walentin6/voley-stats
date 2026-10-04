/**
 * Intérprete de códigos de scouting escritos con el teclado.
 * Gramática completa en docs/05-codigos-de-scouting.md.
 *
 *   [equipo] número fundamento calidad     →  "7A#", "a12R+", "*4S="
 *   [equipo] p                             →  "ap" (punto manual al visitante)
 *
 * equipo: "*" = local (por defecto si se omite), "a" = visitante.
 */
import { QUALITIES, SKILLS } from './skills';
import type { Match, Quality, Skill, TeamSide } from './types';

export type ParsedCode =
  | { kind: 'action'; team: TeamSide; playerNumber: number; skill: Skill; quality: Quality }
  | { kind: 'point'; team: TeamSide };

export type ParseResult = { ok: true; value: ParsedCode } | { ok: false; error: string };

const ACTION_RE = /^(\d{1,2})([a-z])(.)$/i;

export function parseCode(input: string): ParseResult {
  let text = input.trim();
  if (text === '') return { ok: false, error: 'Escribe un código, por ejemplo 7A#' };

  // 1) Prefijo de equipo
  let team: TeamSide = 'home';
  if (text.startsWith('*')) {
    text = text.slice(1);
  } else if (/^a/i.test(text)) {
    team = 'away';
    text = text.slice(1);
  }

  // 2) Punto manual
  if (/^p$/i.test(text)) return { ok: true, value: { kind: 'point', team } };

  // 3) Acción de jugador
  const m = ACTION_RE.exec(text);
  if (!m) {
    return { ok: false, error: `"${input.trim()}" no tiene el formato número + fundamento + calidad (ej. 7A#)` };
  }
  const playerNumber = Number(m[1]);
  const skill = m[2]!.toUpperCase() as Skill;
  const quality = m[3] as Quality;

  if (!SKILLS.includes(skill)) {
    return { ok: false, error: `Fundamento "${m[2]}" desconocido. Usa ${SKILLS.join(', ')}` };
  }
  if (!QUALITIES.includes(quality)) {
    return { ok: false, error: `Calidad "${quality}" desconocida. Usa ${QUALITIES.join(' ')}` };
  }
  return { ok: true, value: { kind: 'action', team, playerNumber, skill, quality } };
}

/** Comprueba que el código sea válido para este partido (por ejemplo, que el jugador exista). */
export function validateParsedCode(match: Match, code: ParsedCode): string | null {
  if (code.kind === 'point') return null;
  const team = match[code.team];
  if (!team.players.some((p) => p.number === code.playerNumber)) {
    return `${team.name} no tiene un jugador con el número ${code.playerNumber}`;
  }
  return null;
}
