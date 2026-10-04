/**
 * Pantallas de la aplicación. La navegación es un simple "estado" en App.tsx
 * (sin librería de rutas) para mantenerlo sencillo en esta etapa.
 */
export type Screen =
  | { name: 'home' }
  | { name: 'teams' }
  | { name: 'team-editor'; teamId: string | null }
  | { name: 'new-match' }
  | { name: 'match'; matchId: string };

export type Navigate = (screen: Screen) => void;
