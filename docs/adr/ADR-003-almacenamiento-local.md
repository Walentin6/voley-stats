# ADR-003 — Guardar en localStorage en el MVP

- Estado: Aceptada (se revisará en la etapa 5)
- Fecha: 2026-10-03

## Contexto
La app debe funcionar sin internet y no perder datos. En el MVP no hay servidor ni cuentas.

## Decisión
Guardar en el `localStorage` del navegador, con **una clave por partido** y guardado
**inmediato después de cada evento**. Todo el acceso pasa por `src/storage/repository.ts`.

## Alternativas consideradas
- **IndexedDB**: más capacidad (cientos de MB) pero una API más compleja. Será el paso
  natural en la etapa 5.
- **Servidor en la nube**: requiere internet, cuentas y costos. Para la etapa 8.

## Consecuencias
- ✅ Muy simple; lectura y escritura síncronas (no hay estados de "guardando...").
- ✅ Cambiar de tecnología más adelante solo afecta a `repository.ts`.
- ⚠️ Límite de ~5 MB (del orden de 20–30 partidos completos).
- ⚠️ Los datos están solo en ese navegador y dispositivo. Mitigación: botón **Exportar**.
- ⚠️ Si el usuario borra los datos del navegador, se pierden.
