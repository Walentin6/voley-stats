/**
 * Genera identificadores únicos. crypto.randomUUID solo existe en contextos
 * seguros (https o localhost); si se abre la app por IP en la red local, se
 * usa una alternativa.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
