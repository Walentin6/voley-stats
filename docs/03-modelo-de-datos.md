# 03 — Modelo de datos

Definido en [`src/domain/types.ts`](../src/domain/types.ts).

## Diagrama

```
Team ──< Player
  │
  │ (se copia al crear el partido)
  ▼
Match
 ├─ home: MatchTeam ──< Player
 ├─ away: MatchTeam ──< Player
 ├─ settings: MatchSettings
 └─ events: MatchEvent[]   ← lo único que cambia durante el partido
              ├─ ActionEvent        (acción de un jugador)
              ├─ PointEvent         (punto asignado a mano)
              ├─ TimeoutEvent       (tiempo muerto)
              ├─ SubstitutionEvent  (cambio de jugador)
              ├─ ServeChangeEvent   (indicar a mano quién saca)
              └─ LineupEvent        (formación en cancha)
```

Todos los eventos tienen `id`, `type`, `team` y `timestamp`.

## Entidades

### Team (equipo)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | texto | Identificador único |
| `name` | texto | Nombre del equipo |
| `players` | Player[] | Plantilla |
| `createdAt`, `updatedAt` | fecha ISO | Auditoría |

### Player (jugador)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | texto | Identificador único |
| `number` | 0–99 | Número de camiseta, **único dentro del equipo** |
| `name` | texto | Nombre (opcional) |
| `position` | `S` `OH` `MB` `OP` `L` | Armador, punta, central, opuesto, líbero (opcional) |

### Match (partido)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | texto | Identificador único |
| `date` | AAAA-MM-DD | Fecha del partido |
| `competition` | texto | Liga o torneo (puede estar vacío) |
| `home`, `away` | MatchTeam | **Copia** de los equipos al crear el partido |
| `settings` | MatchSettings | Formato del partido |
| `events` | MatchEvent[] | Todo lo que pasó, en orden |

¿Por qué una copia de los equipos? Si después editas la plantilla (cambias un número,
borras un jugador), los partidos ya jugados no se alteran.

### MatchSettings
| Campo | Por defecto | Descripción |
|---|---|---|
| `bestOf` | 5 | Al mejor de 3 o 5 sets |
| `pointsPerSet` | 25 | Puntos para ganar un set normal |
| `pointsTiebreak` | 15 | Puntos para ganar el set decisivo |
| `firstServe` | `home` | Quién saca primero en el set 1 |

### ActionEvent
| Campo | Ejemplo | Descripción |
|---|---|---|
| `type` | `'action'` | Tipo de evento |
| `team` | `'home'` | Equipo que hizo la acción |
| `playerNumber` | `7` | Número del jugador |
| `skill` | `'A'` | Fundamento ([04](04-reglas-de-juego.md)) |
| `quality` | `'#'` | Calidad ([04](04-reglas-de-juego.md)) |
| `timestamp` | `2026-10-03T21:15:04Z` | Momento en que se registró (servirá para sincronizar video) |

### PointEvent
Punto asignado a un equipo sin acción de jugador (error de rotación del rival, red,
sanción, o simplemente una acción que no se registró). `type: 'point'`.

### TimeoutEvent
Tiempo muerto pedido por `team`. `type: 'timeout'`. No cambia marcador ni saque.

### SubstitutionEvent
| Campo | Ejemplo | Descripción |
|---|---|---|
| `type` | `'substitution'` | Tipo de evento |
| `team` | `'home'` | Equipo que hace el cambio |
| `playerOut` | `7` | Número del jugador que sale |
| `playerIn` | `12` | Número del jugador que entra |

### ServeChangeEvent
`type: 'serve'`. A partir de este evento, saca `team`. Se usa para elegir el saque del
set decisivo y para corregir errores con *⇄ Cambiar saque*.

### LineupEvent
| Campo | Ejemplo | Descripción |
|---|---|---|
| `type` | `'lineup'` | Tipo de evento |
| `team` | `'home'` | Equipo |
| `positions` | `[1, 4, 9, 12, 7, 11]` | 6 números: índice 0 = P1 (saca), 1 = P2, ..., 5 = P6 |

Se registra al empezar el set (o al corregir la formación). Desde ese momento la app sigue
la rotación de ese equipo hasta el final del set.

## Lo que NO se guarda

El marcador, los sets ganados, quién saca, la rotación actual de cada equipo, los tiempos y
cambios usados en cada set, los avisos de carga y las estadísticas **no se guardan**: se calculan a partir de `events`
cada vez. Así nunca pueden quedar desincronizados.
Ver [ADR-002](adr/ADR-002-partido-como-eventos.md).

## Almacenamiento

En el `localStorage` del navegador ([ADR-003](adr/ADR-003-almacenamiento-local.md)):

| Clave | Contenido |
|---|---|
| `voley:v1:teams` | Lista de todos los equipos |
| `voley:v1:match:<id>` | Un partido completo |

El `v1` es la versión del formato. Si en el futuro cambia la estructura, se usará `v2`
y una migración que convierta los datos viejos.

Tamaño aproximado: un partido de 5 sets tiene unas 600–1000 acciones ≈ 150–250 KB.
El navegador permite unos 5 MB, es decir, del orden de 20–30 partidos completos. Para
guardar temporadas enteras habrá que pasar a IndexedDB (ver hoja de ruta).

## Exportación e importación

El botón **Exportar** descarga el objeto `Match` tal cual, en JSON legible
(`2026-10-03_Club_Norte_vs_Sur_Vóley.json`).

El botón **Importar** ([`src/storage/import.ts`](../src/storage/import.ts)) hace el camino
inverso. Antes de guardar, revisa campo por campo que el archivo sea un partido válido
(equipos, jugadores, configuración y cada evento). Si algo falla, dice dónde
("Evento 12: fundamento inválido") y no guarda nada. Los partidos exportados con la v0.1
se pueden importar sin problemas.
