/** Utilidades SOLO para las pruebas: crean partidos de ejemplo rápidamente. */
import { parseCode } from './code-parser';
import { createMatch, DEFAULT_SETTINGS, eventFromCode } from './factories';
import type { Match, MatchSettings, Team } from './types';

function team(name: string, numbers: number[]): Team {
  return {
    id: name,
    name,
    players: numbers.map((n) => ({ id: `${name}-${n}`, number: n, name: `Jugador ${n}` })),
    createdAt: '',
    updatedAt: '',
  };
}

export function makeMatch(settings: Partial<MatchSettings> = {}): Match {
  return createMatch({
    date: '2026-10-03',
    competition: 'Prueba',
    home: team('Local', [1, 2, 3, 4, 5, 6, 7]),
    away: team('Visita', [1, 2, 3, 4, 5, 6, 12]),
    settings: { ...DEFAULT_SETTINGS, ...settings },
  });
}

/** Agrega eventos a partir de códigos ("7A#", "ap", ...). */
export function withCodes(match: Match, codes: string[]): Match {
  const events = codes.map((c) => {
    const r = parseCode(c);
    if (!r.ok) throw new Error(r.error);
    return eventFromCode(r.value);
  });
  return { ...match, events: [...match.events, ...events] };
}

/** Repite un código n veces. */
export function times(code: string, n: number): string[] {
  return Array.from({ length: n }, () => code);
}
