/**
 * Agrupa los eventos del partido en rallies (desde el saque hasta el punto).
 * Lo usan las estadísticas que dependen del orden de las acciones dentro de un
 * rally: ataque después de recepción, contraataque y side-out por recepción.
 */
import type { MatchState } from './match-state';
import type { ActionEvent, Match, Quality, TeamSide } from './types';
import { otherSide } from './types';

export interface Rally {
  setIndex: number;
  /** Equipo que sacaba en este rally. */
  servingTeam: TeamSide;
  /** Quién ganó el rally. */
  pointTo: TeamSide;
  /** Acciones del rally en orden (incluye los "espejos" que se cargaron después del punto). */
  actions: ActionEvent[];
}

/**
 * Devuelve los rallies terminados del partido, en orden. Tiempos muertos,
 * cambios y formaciones no forman parte de ningún rally. Un rally que todavía
 * no terminó (sin punto) no se incluye.
 */
export function buildRallies(match: Match, state: MatchState): Rally[] {
  const rallies: Rally[] = [];
  let current: ActionEvent[] = [];

  for (const event of match.events) {
    const info = state.info[event.id];
    if (!info || info.afterEnd) continue;

    if (event.type === 'serve') {
      current = []; // cambio manual de saque: lo que había queda descartado
      continue;
    }
    if (event.type !== 'action' && event.type !== 'point') continue;

    // Un espejo describe el punto del rally anterior (ej. el R= de un ace).
    if (info.mirrorOf) {
      if (event.type === 'action') rallies.at(-1)?.actions.push(event);
      continue;
    }

    if (event.type === 'action') current.push(event);
    if (info.pointTo) {
      rallies.push({ setIndex: info.setIndex, servingTeam: info.servingTeam, pointTo: info.pointTo, actions: current });
      current = [];
    }
  }
  return rallies;
}

/** Recepción del rally (la primera R del equipo que recibe), o null si no se cargó. */
export function receptionOf(rally: Rally): ActionEvent | null {
  const receiving = otherSide(rally.servingTeam);
  return rally.actions.find((a) => a.skill === 'R' && a.team === receiving) ?? null;
}

/**
 * Ataque después de recepción (K1): el primer ataque del equipo que recibe,
 * siempre que el rival no haya tocado la pelota entre el saque y ese ataque.
 * Devuelve null si no lo hubo (por ejemplo, error de recepción).
 */
export function firstAttackAfterReception(rally: Rally): ActionEvent | null {
  const receiving = otherSide(rally.servingTeam);
  for (const a of rally.actions) {
    if (a.team !== receiving) {
      if (a.skill === 'S') continue; // el saque del rival es lo que inicia el rally
      return null; // el rival tocó la pelota: ya es contraataque
    }
    if (a.skill === 'A') return a;
  }
  return null;
}

/** Calidades agrupadas como en los informes: positiva (# +) y negativa (el resto). */
export function isPositiveReception(q: Quality): boolean {
  return q === '#' || q === '+';
}
