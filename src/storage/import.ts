/**
 * Importación de respaldos JSON (los que genera el botón "Exportar").
 * Revisa el archivo con cuidado antes de aceptarlo: un archivo dañado no debe
 * romper la app ni mezclarse con los datos buenos.
 */
import { nowIso } from '../domain/ids';
import { QUALITIES, SKILLS } from '../domain/skills';
import type { Match, MatchEvent, MatchTeam, Player, Position, Quality, Skill, TeamSide } from '../domain/types';

export type ImportResult = { ok: true; match: Match } | { ok: false; error: string };

class InvalidFile extends Error {}

type Obj = Record<string, unknown>;

const POSITIONS: readonly Position[] = ['S', 'OH', 'MB', 'OP', 'L'];
const EVENT_TYPES = ['action', 'point', 'timeout', 'substitution', 'serve', 'lineup'] as const;

function fail(message: string): never {
  throw new InvalidFile(message);
}

function obj(value: unknown, where: string): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(`${where}: se esperaba un objeto`);
  return value as Obj;
}

function str(o: Obj, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== 'string') fail(`${where}: falta el texto "${key}"`);
  return v;
}

function jersey(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 99) fail(`${where}: número de jugador inválido`);
  return v;
}

function side(v: unknown, where: string): TeamSide {
  if (v !== 'home' && v !== 'away') fail(`${where}: el equipo debe ser "home" o "away"`);
  return v;
}

function parsePlayer(value: unknown, where: string): Player {
  const o = obj(value, where);
  const position = o.position;
  if (position !== undefined && !POSITIONS.includes(position as Position)) fail(`${where}: posición inválida`);
  return {
    id: str(o, 'id', where),
    number: jersey(o.number, where),
    name: typeof o.name === 'string' ? o.name : '',
    ...(position ? { position: position as Position } : {}),
  };
}

function parseTeam(value: unknown, where: string): MatchTeam {
  const o = obj(value, where);
  if (!Array.isArray(o.players)) fail(`${where}: falta la lista de jugadores`);
  return {
    teamId: str(o, 'teamId', where),
    name: str(o, 'name', where),
    players: o.players.map((p, i) => parsePlayer(p, `${where}, jugador ${i + 1}`)),
  };
}

function parseEvent(value: unknown, where: string): MatchEvent {
  const o = obj(value, where);
  const type = o.type as (typeof EVENT_TYPES)[number];
  if (!EVENT_TYPES.includes(type)) fail(`${where}: tipo de evento desconocido`);
  const base = { id: str(o, 'id', where), timestamp: str(o, 'timestamp', where), team: side(o.team, where) };
  switch (type) {
    case 'point':
    case 'timeout':
    case 'serve':
      return { ...base, type };
    case 'substitution':
      return { ...base, type, playerOut: jersey(o.playerOut, where), playerIn: jersey(o.playerIn, where) };
    case 'lineup': {
      if (!Array.isArray(o.positions) || o.positions.length !== 6) fail(`${where}: la formación necesita 6 jugadores`);
      return { ...base, type, positions: o.positions.map((n) => jersey(n, where)) };
    }
    case 'action': {
      const skill = o.skill as Skill;
      const quality = o.quality as Quality;
      if (!SKILLS.includes(skill)) fail(`${where}: fundamento inválido`);
      if (!QUALITIES.includes(quality)) fail(`${where}: calidad inválida`);
      return { ...base, type, playerNumber: jersey(o.playerNumber, where), skill, quality };
    }
  }
}

function positiveInt(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) fail(`${where}: debe ser un número entero mayor que 0`);
  return v;
}

/** Convierte el texto de un archivo .json en un partido, o explica por qué no se puede. */
export function parseMatchJson(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  try {
    const o = obj(data, 'Partido');
    const s = obj(o.settings, 'Configuración');
    if (s.bestOf !== 3 && s.bestOf !== 5) fail('Configuración: "bestOf" debe ser 3 o 5');
    if (!Array.isArray(o.events)) fail('Partido: falta la lista de eventos');
    const now = nowIso();
    const match: Match = {
      id: str(o, 'id', 'Partido'),
      date: str(o, 'date', 'Partido'),
      competition: typeof o.competition === 'string' ? o.competition : '',
      home: parseTeam(o.home, 'Equipo local'),
      away: parseTeam(o.away, 'Equipo visitante'),
      settings: {
        bestOf: s.bestOf,
        pointsPerSet: positiveInt(s.pointsPerSet, 'Puntos por set'),
        pointsTiebreak: positiveInt(s.pointsTiebreak, 'Puntos del set decisivo'),
        firstServe: side(s.firstServe, 'Saque inicial'),
      },
      events: o.events.map((e, i) => parseEvent(e, `Evento ${i + 1}`)),
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : now,
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : now,
    };
    return { ok: true, match };
  } catch (err) {
    if (err instanceof InvalidFile) return { ok: false, error: `Archivo inválido. ${err.message}.` };
    throw err;
  }
}
