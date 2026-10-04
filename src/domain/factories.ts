/** Funciones para crear objetos del dominio con valores por defecto correctos. */
import { createId, nowIso } from './ids';
import type { ParsedCode } from './code-parser';
import type { Match, MatchEvent, MatchSettings, Team } from './types';

export const DEFAULT_SETTINGS: MatchSettings = {
  bestOf: 5,
  pointsPerSet: 25,
  pointsTiebreak: 15,
  firstServe: 'home',
};

export function createTeam(name = ''): Team {
  const now = nowIso();
  return { id: createId(), name, players: [], createdAt: now, updatedAt: now };
}

export interface NewMatchInput {
  date: string;
  competition: string;
  home: Team;
  away: Team;
  settings: MatchSettings;
}

export function createMatch(input: NewMatchInput): Match {
  const now = nowIso();
  const snapshot = (t: Team) => ({
    teamId: t.id,
    name: t.name,
    players: t.players.map((p) => ({ ...p })),
  });
  return {
    id: createId(),
    date: input.date,
    competition: input.competition,
    home: snapshot(input.home),
    away: snapshot(input.away),
    settings: { ...input.settings },
    events: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Convierte un código interpretado (o una selección con botones) en un evento. */
export function eventFromCode(code: ParsedCode): MatchEvent {
  const base = { id: createId(), timestamp: nowIso(), team: code.team };
  if (code.kind === 'point') return { ...base, type: 'point' };
  return {
    ...base,
    type: 'action',
    playerNumber: code.playerNumber,
    skill: code.skill,
    quality: code.quality,
  };
}
