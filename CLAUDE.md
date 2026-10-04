# Guía para asistentes de IA (y para personas)

- Idioma: interfaz, comentarios y documentación en **español**; identificadores de código en inglés.
- El dueño del proyecto tiene poca experiencia programando: explicar los cambios de forma simple.
- Antes de terminar un cambio: `npm test` y `npm run build` deben pasar.

## Arquitectura (resumen)

- `src/domain/`: lógica pura, sin React ni navegador. Todo lo que se agregue aquí lleva pruebas (`*.test.ts`).
- Un partido es una **lista de eventos**; marcador y estadísticas se calculan (`match-state.ts`, `stats.ts`). No guardar valores derivados.
- `src/storage/repository.ts` es el único módulo que toca `localStorage`.
- `src/ui/`: pantallas en `screens/`, partes de la pantalla de partido en `live/`.

## Documentación

- Si cambian las reglas, códigos o fórmulas, actualizar `docs/04`, `docs/05` o `docs/06`.
- Decisiones importantes: nuevo ADR en `docs/adr/`.
- Anotar cada cambio visible en `CHANGELOG.md` (sección "Sin publicar").
