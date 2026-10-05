/**
 * Preferencias del usuario en este dispositivo (no son parte de los partidos).
 * Clave: voley:v1:prefs
 */
const KEY = 'voley:v1:prefs';

export interface Prefs {
  /** Mostrar la cancha para cargar zonas después de cada saque y ataque. */
  zonesEnabled: boolean;
}

const DEFAULTS: Prefs = { zonesEnabled: false };

export function getPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Si no se puede guardar, la preferencia solo dura hasta cerrar la página.
  }
}
