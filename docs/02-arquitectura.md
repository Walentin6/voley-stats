# 02 — Arquitectura

## Tecnologías

| Pieza | Qué es | Para qué la usamos |
|---|---|---|
| **TypeScript** | JavaScript con tipos | Detecta errores antes de ejecutar ("este campo no existe") |
| **React** | Librería de interfaces | Dibuja las pantallas a partir del estado |
| **Vite** | Herramienta de desarrollo | Servidor local y compilación final |
| **Vitest** | Ejecutor de pruebas | Pruebas automáticas de la lógica |
| **vite-plugin-pwa** | Plugin de Vite | Convierte la app en PWA (instalable y sin conexión) |
| **localStorage** | Almacenamiento del navegador | Guarda equipos y partidos en el dispositivo |

Por qué una app web: ver [ADR-001](adr/ADR-001-app-web-pwa.md).

## Capas

El código está dividido en tres capas. Cada capa solo puede usar a las de abajo:

```
┌────────────────────────────────────────────┐
│ ui/        Pantallas y componentes (React) │
├────────────────────────────────────────────┤
│ storage/   Guardar y leer datos            │
├────────────────────────────────────────────┤
│ domain/    Reglas del vóley (lógica pura)  │
└────────────────────────────────────────────┘
```

- **domain** no sabe nada de React ni del navegador. Recibe datos y devuelve datos.
  Por eso se puede probar fácilmente, y se podría reutilizar en otra app (por ejemplo,
  una versión de escritorio o un servidor).
- **storage** es el único lugar que toca `localStorage`. Si mañana guardamos en
  IndexedDB o en un servidor, solo cambia esta carpeta.
- **ui** muestra el estado y traduce los clics a eventos del dominio.

## Archivos importantes

### `src/domain/`
| Archivo | Responsabilidad |
|---|---|
| `types.ts` | Tipos centrales: `Team`, `Player`, `Match`, `MatchEvent`... |
| `skills.ts` | Fundamentos, calidades, etiquetas, qué acciones dan punto, pares espejo |
| `match-state.ts` | Reproduce los eventos y calcula marcador, sets, saque, ganador, rotaciones, tiempos/cambios por set y avisos de carga |
| `rotation.ts` | Formaciones: rotar, nombre de la rotación (P1–P6), validar formación |
| `zones.ts` | Zonas de la cancha (1–9), nombres y textos de recorrido |
| `code-parser.ts` | Interpreta los códigos de teclado (`7A#`) |
| `stats.ts` | Cuenta acciones por jugador/equipo (puntos, BP, errores, sets jugados) |
| `rallies.ts` | Agrupa los eventos en rallies; detecta recepción y ataque después de recepción (K1) |
| `report.ts` | Análisis tipo informe de Data Volley: por set, ataque por fase, distribución por zona, mapas, side-out por recepción, puntos regalados |
| `metrics.ts` | Porcentajes (eficacia, positividad...) |
| `factories.ts` | Crea equipos, partidos y eventos con valores correctos |
| `ids.ts` | Identificadores únicos y fechas |
| `*.test.ts` | Pruebas automáticas |

### `src/storage/`
| Archivo | Responsabilidad |
|---|---|
| `repository.ts` | Leer/guardar/borrar equipos y partidos |
| `export.ts` | Descargar un partido como JSON |
| `import.ts` | Leer y validar un partido desde un JSON (+ pruebas en `import.test.ts`) |
| `prefs.ts` | Preferencias de este dispositivo (cargar zonas sí/no) |

### `src/ui/`
| Carpeta / archivo | Responsabilidad |
|---|---|
| `navigation.ts` | Lista de pantallas posibles |
| `screens/` | Una pantalla por archivo (inicio, equipos, editor, nuevo partido, partido) |
| `live/` | Partes de la pantalla de partido: marcador, botones, códigos, historial, formación, zonas, estadísticas, mapas |
| `court/` | Cancha dibujada en SVG (`Court.tsx`) y su geometría (`geometry.ts`) |
| `hooks/useMatch.ts` | Carga un partido, calcula su estado y lo guarda tras cada cambio |
| `components/Page.tsx` | Estructura común (barra superior + contenido) |
| `format.ts` | Textos legibles para eventos y fechas |

## Flujo de una acción

```
Usuario pulsa "7" → "Ataque" → "#"      (o escribe 7A# + Enter)
        │
        ▼
ActionPad / CodeInput  ──►  ParsedCode {team, playerNumber, skill, quality}
        │
        ▼
eventFromCode()        ──►  MatchEvent (con id y hora)
        │
        ▼
useMatch.addEvent()    ──►  agrega el evento a match.events
        │                   y llama a saveMatch() (guardado inmediato)
        ▼
computeMatchState()    ──►  marcador, sets y saque recalculados
        │
        ▼
React vuelve a dibujar el marcador, el historial y las estadísticas
```

La idea de "lista de eventos" está explicada en [ADR-002](adr/ADR-002-partido-como-eventos.md).

## Navegación

No usamos librería de rutas: `App.tsx` guarda en un estado qué pantalla se muestra
(`Screen` en `navigation.ts`). Es suficiente para esta etapa. Si más adelante se necesitan
enlaces directos (por ejemplo, compartir la URL de un partido), se puede agregar
React Router.
