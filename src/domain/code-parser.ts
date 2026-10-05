/**
 * Intérprete de códigos de scouting escritos con el teclado.
 * Gramática completa en docs/05-codigos-de-scouting.md.
 *
 *   [equipo] número fundamento calidad     →  "7A#", "a12R+", "*4S="
 *   [equipo] S calidad                     →  "S+"     (saque del jugador en P1; requiere formación)
 *   [equipo] p                             →  "ap"     (punto manual)
 *   [equipo] T                             →  "aT"     (tiempo muerto)
 *   [equipo] c sale:entra                  →  "c7:12"  (cambio)
 *
 * equipo: "*" = local, "a" = visitante. Si se omite:
 *   - saque (S)     → el equipo que tiene el saque
 *   - recepción (R) → el equipo que recibe
 *   - lo demás      → local
 * (el saque/recepción automático solo funciona si se pasa el contexto).
 */
import { eventFromCode } from './factories';
import { computeMatchState, type Courts, type RallyWarning } from './match-state';
import { validateLineup } from './rotation';
import { QUALITIES, SKILLS } from './skills';
import type { Match, Quality, Skill, TeamSide } from './types';
import { otherSide } from './types';

/**
 * Lo que el usuario quiere registrar, antes de convertirlo en evento.
 * Lo producen tanto los códigos de teclado como los botones.
 */
export type ParsedCode =
  | { kind: 'action'; team: TeamSide; playerNumber: number; skill: Skill; quality: Quality }
  | { kind: 'point'; team: TeamSide }
  | { kind: 'timeout'; team: TeamSide }
  | { kind: 'substitution'; team: TeamSide; playerOut: number; playerIn: number }
  /** Cambio manual de saque (solo desde botones, no tiene código). */
  | { kind: 'serve'; team: TeamSide }
  /** Formación en cancha (solo desde botones, no tiene código). */
  | { kind: 'lineup'; team: TeamSide; positions: number[] };

export type ParseResult = { ok: true; value: ParsedCode } | { ok: false; error: string };

/** Información del partido que ayuda a completar códigos incompletos. */
export interface ParseContext {
  servingTeam: TeamSide;
  /** Jugador en la posición 1 de cada equipo (si hay formación cargada). */
  servers?: Partial<Record<TeamSide, number>>;
}

const ACTION_RE = /^(\d{1,2})([a-z])(.)$/i;
/** Saque sin número ("S+"): el sacador sale de la formación. */
const SERVE_NO_NUMBER_RE = /^s(.)$/i;
const SUBSTITUTION_RE = /^c(\d{1,2})[:.](\d{1,2})$/i;

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
  const team = explicitTeam ?? 'home';

  // 2) Códigos sin jugador
  if (/^p$/i.test(text)) return { ok: true, value: { kind: 'point', team } };
  if (/^t$/i.test(text)) return { ok: true, value: { kind: 'timeout', team } };
  const sub = SUBSTITUTION_RE.exec(text);
  if (sub) {
    const playerOut = Number(sub[1]);
    const playerIn = Number(sub[2]);
    if (playerOut === playerIn) return { ok: false, error: 'En un cambio, el que sale y el que entra deben ser distintos' };
    return { ok: true, value: { kind: 'substitution', team, playerOut, playerIn } };
  }

  // 3) Saque sin número: lo hace el jugador en posición 1
  const serve = SERVE_NO_NUMBER_RE.exec(text);
  if (serve) {
    const quality = serve[1] as Quality;
    if (!QUALITIES.includes(quality)) {
      return { ok: false, error: `Calidad "${quality}" desconocida. Usa ${QUALITIES.join(' ')}` };
    }
    const serveTeam = explicitTeam ?? context?.servingTeam ?? 'home';
    const server = context?.servers?.[serveTeam];
    if (server === undefined) {
      return { ok: false, error: 'Sin formación cargada, el saque necesita el número del jugador (ej. 5S+)' };
    }
    return { ok: true, value: { kind: 'action', team: serveTeam, playerNumber: server, skill: 'S', quality } };
  }

  // 4) Acción de jugador
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
  return {
    ok: true,
    value: { kind: 'action', team: explicitTeam ?? defaultTeam(skill, context), playerNumber, skill, quality },
  };
}

/** Comprueba que el código sea válido para este partido (por ejemplo, que el jugador exista). */
export function validateParsedCode(match: Match, code: ParsedCode): string | null {
  const team = match[code.team];
  const missing = (n: number) =>
    team.players.some((p) => p.number === n) ? null : `${team.name} no tiene un jugador con el número ${n}`;
  if (code.kind === 'action') return missing(code.playerNumber);
  if (code.kind === 'substitution') return missing(code.playerOut) ?? missing(code.playerIn);
  if (code.kind === 'lineup') return validateLineup(match, code.team, code.positions);
  return null;
}

/** Jugador en posición 1 de cada equipo con formación cargada. */
export function serversOf(courts: Courts): Partial<Record<TeamSide, number>> {
  const servers: Partial<Record<TeamSide, number>> = {};
  if (courts.home) servers.home = courts.home.positions[0];
  if (courts.away) servers.away = courts.away.positions[0];
  return servers;
}

export type ParseLineResult =
  | {
      ok: true;
      codes: ParsedCode[];
      /** Avisos de carga de cada código (mismo orden que codes). */
      warnings: RallyWarning[][];
    }
  | { ok: false; error: string };

/**
 * Interpreta una línea con uno o varios códigos separados por espacios
 * ("5S= 3S+ a4R-"). Cada código se interpreta con el saque del momento: si un
 * código termina el rally, el siguiente ya ve el saque actualizado.
 * Si alguno es inválido, no se devuelve ninguno.
 */
export function parseLine(match: Match, line: string): ParseLineResult {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  const codes: ParsedCode[] = [];
  const warnings: RallyWarning[][] = [];
  let working = match;
  let state = computeMatchState(working);
  for (const part of parts) {
    const r = parseCode(part, { servingTeam: state.serving, servers: serversOf(state.courts) });
    if (!r.ok) return { ok: false, error: r.error };
    const problem = validateParsedCode(match, r.value);
    if (problem) return { ok: false, error: problem };
    codes.push(r.value);
    // Evento provisional, solo para simular cómo sigue el partido.
    const event = eventFromCode(r.value);
    working = { ...working, events: [...working.events, event] };
    state = computeMatchState(working);
    warnings.push(state.info[event.id]?.warnings ?? []);
  }
  return { ok: true, codes, warnings };
}
