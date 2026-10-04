/**
 * Guardado de equipos y partidos en el propio navegador (localStorage).
 * Ver docs/adr/ADR-003-almacenamiento-local.md.
 *
 * Toda la app accede a los datos SOLO a través de este módulo. Si en el futuro
 * se cambia a IndexedDB o a un servidor, solo hay que reescribir este archivo.
 *
 * Claves usadas:
 *   voley:v1:teams          → lista de equipos
 *   voley:v1:match:<id>     → un partido (se guarda por separado para que
 *                             cada acción solo reescriba su propio partido)
 */
import type { Match, Team } from '../domain/types';

const PREFIX = 'voley:v1:';
const TEAMS_KEY = `${PREFIX}teams`;
const MATCH_PREFIX = `${PREFIX}match:`;

export class StorageError extends Error {}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    throw new StorageError(
      'No se pudo guardar. Puede que el almacenamiento del navegador esté lleno o bloqueado. ' +
        'Exporta el partido como respaldo.',
      { cause: err },
    );
  }
}

// ---------- Equipos ----------

export function listTeams(): Team[] {
  return (read<Team[]>(TEAMS_KEY) ?? []).sort((a, b) => a.name.localeCompare(b.name));
}

export function getTeam(id: string): Team | null {
  return listTeams().find((t) => t.id === id) ?? null;
}

export function saveTeam(team: Team): void {
  const teams = listTeams().filter((t) => t.id !== team.id);
  write(TEAMS_KEY, [...teams, team]);
}

export function deleteTeam(id: string): void {
  write(
    TEAMS_KEY,
    listTeams().filter((t) => t.id !== id),
  );
}

// ---------- Partidos ----------

export function listMatches(): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MATCH_PREFIX)) {
      const m = read<Match>(key);
      if (m) matches.push(m);
    }
  }
  // Más recientes primero
  return matches.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

export function getMatch(id: string): Match | null {
  return read<Match>(MATCH_PREFIX + id);
}

export function saveMatch(match: Match): void {
  write(MATCH_PREFIX + match.id, match);
}

export function deleteMatch(id: string): void {
  localStorage.removeItem(MATCH_PREFIX + id);
}
