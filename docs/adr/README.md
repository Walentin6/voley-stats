# Registro de decisiones (ADR)

Un **ADR** (*Architecture Decision Record*) explica una decisión técnica importante:
el contexto, qué se decidió, qué alternativas había y qué consecuencias tiene. Sirve
para que, dentro de un año, se entienda *por qué* el proyecto es como es.

| ADR | Título | Estado |
|---|---|---|
| [001](ADR-001-app-web-pwa.md) | Aplicación web instalable (PWA) | Aceptada |
| [002](ADR-002-partido-como-eventos.md) | El partido es una lista de eventos | Aceptada |
| [003](ADR-003-almacenamiento-local.md) | Guardar en localStorage en el MVP | Aceptada |
| [004](ADR-004-codigos-compatibles.md) | Códigos compatibles con Data Volley | Aceptada |

## Plantilla para un ADR nuevo

```markdown
# ADR-00X — Título

- Estado: Propuesta | Aceptada | Reemplazada por ADR-00Y
- Fecha: AAAA-MM-DD

## Contexto
¿Qué problema hay que resolver?

## Decisión
¿Qué se decidió?

## Alternativas consideradas
¿Qué otras opciones había y por qué no?

## Consecuencias
¿Qué ganamos y qué perdemos?
```
