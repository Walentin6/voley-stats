/**
 * Intérprete de códigos de scouting escritos con el teclado.
 * Gramática completa en docs/05-codigos-de-scouting.md.
 *
 *   [equipo] número fundamento calidad     →  "7A#", "a12R+", "*4S="
 *   [equipo] p                             →  "ap" (punto manual al visitante)
 *
 * equipo: "*" = local, "a" = visitante. Si se omite:
 *   - saque (S)     → el equipo que tiene el saque
 *   - recepción (R) → el equipo que recibe
 *   - lo demás      → local
 * (el saque/recepción automático solo funciona si se pasa el contexto).
 */
import { eventFromCode } from './factories';
import { computeMatchState } from './match-state';
import { QUALITIES, SKILLS } from './skills';
import type { Match, Quality, Skill, TeamSide } from './types';
import { otherSide } from './types';

export type ParsedCode =
  | { kind: 'action'; team: TeamSide; playerNumber: number; skill: Skill; quality: Quality }
  | { kind: 'point'; team: TeamSide };

export type ParseResult = { ok: true; value: ParsedCode } | { ok: false; error: string };

/** Información del partido que ayuda a completar códigos sin prefijo. */
export interface ParseContext {
  servingTeam: TeamSide;
}

const ACTION_RE = /^(\d{1,2})([a-z])(.)$/i;

/** Equipo por defecto cuando el código no tiene prefijo. */
function defaultTeam(skill: Skill, context?: ParseContext): TeamSide {
  if (context && skill === 'S') return context.servingTeam;
  if (context && skill === 'R') return otherSide(context.servingTeam);
  return 'home';
}

export function parseCode(input: string, context?: ParseContext): ParseResult {
  let text = input.trim();
  if (text === '') return { ok: false, error: 'Escribe un código, por ejemplo 7A#' };

  // 1) Prefijo de equipo (null = no se escribió)
  let explicitTeam: TeamSide | null = null;
  if (text.startsWith('*')) {
    explicitTeam = 'home';
    text = text.slice(1);
  } else if (/^a/i.test(text)) {
    explicitTeam = 'away';
    text = text.slice(1);
  }

  // 2) Punto manual
  if (/^p$/i.test(text)) return { ok: true, value: { kind: 'point', team: explicitTeam ?? 'home' } };

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
  const team = explicitTeam ?? defaultTeam(skill, context);
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

export type ParseLineResult = { ok: true; codes: ParsedCode[] } | { ok: false; error: string };

/**
 * Interpreta una línea con uno o varios códigos separados por espacios
 * ("5S= 3S+ a4R-"). Cada código se interpreta con el saque del momento: si un
 * código termina el rally, el siguiente ya ve el saque actualizado.
 * Si alguno es inválido, no se devuelve ninguno.
 */
export function parseLine(match: Match, line: string): ParseLineResult {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  const codes: ParsedCode[] = [];
  let working = match;
  for (const part of parts) {
    const servingTeam = computeMatchState(working).serving;
    const r = parseCode(part, { servingTeam });
    if (!r.ok) return { ok: false, error: r.error };
    const problem = validateParsedCode(match, r.value);
    if (problem) return { ok: false, error: problem };
    codes.push(r.value);
    // Evento provisional, solo para simular cómo sigue el partido.
    working = { ...working, events: [...working.events, eventFromCode(r.value)] };
  }
  return { ok: true, codes };
}
