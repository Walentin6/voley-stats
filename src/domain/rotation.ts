/**
 * Rotaciones: formación en cancha, rotación y nombre de cada rotación.
 * Reglas explicadas en docs/04-reglas-de-juego.md (sección "Rotaciones").
 *
 * Una formación es una lista de 6 números de camiseta, en orden de posición:
 *
 *        RED
 *   P4   P3   P2        índices: [3] [2] [1]
 *   P5   P6   P1                 [4] [5] [0]
 *
 * El jugador en P1 es el que saca.
 */
import type { LineupEvent, Match, Player, TeamSide } from './types';

/** Números de camiseta por posición: índice 0 = P1, ..., 5 = P6. */
export type Lineup = number[];

export const COURT_SIZE = 6;

/**
 * Rota en sentido horario (cuando el equipo recupera el saque):
 * el de P2 pasa a P1, el de P3 a P2, ..., el de P1 a P6.
 */
export function rotate(lineup: Lineup): Lineup {
  return [...lineup.slice(1), lineup[0]!];
}

function positionOf(players: Player[], number: number) {
  return players.find((p) => p.number === number)?.position;
}

export function isLibero(players: Player[], number: number): boolean {
  return positionOf(players, number) === 'L';
}

/**
 * Nombre de la rotación actual:
 * - Si hay un armador (posición "S") en cancha: P1..P6 según dónde esté el armador
 *   (igual que Data Volley).
 * - Si no: R1..R6, contando las rotaciones desde que se cargó la formación.
 */
export function rotationLabel(lineup: Lineup, players: Player[], rotationsSinceLineup: number): string {
  const setterIndex = lineup.findIndex((n) => positionOf(players, n) === 'S');
  if (setterIndex >= 0) return `P${setterIndex + 1}`;
  return `R${(rotationsSinceLineup % COURT_SIZE) + 1}`;
}

/** Comprueba que una formación sea válida. Devuelve el problema o null. */
export function validateLineup(match: Match, team: TeamSide, lineup: Lineup): string | null {
  const players = match[team].players;
  if (lineup.length !== COURT_SIZE) return 'La formación necesita 6 jugadores';
  const seen = new Set<number>();
  for (const [i, n] of lineup.entries()) {
    if (!players.some((p) => p.number === n)) return `P${i + 1}: ${match[team].name} no tiene el número ${n}`;
    if (isLibero(players, n)) return `P${i + 1}: el líbero no va en la formación inicial`;
    if (seen.has(n)) return `El número ${n} está repetido`;
    seen.add(n);
  }
  return null;
}

/** Última formación cargada para un equipo (para proponerla en el set siguiente). */
export function lastLineup(match: Match, team: TeamSide): Lineup | null {
  for (let i = match.events.length - 1; i >= 0; i--) {
    const e = match.events[i]!;
    if (e.type === 'lineup' && e.team === team) return [...(e as LineupEvent).positions];
  }
  return null;
}
