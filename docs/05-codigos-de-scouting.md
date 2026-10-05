# 05 — Códigos de scouting

Implementado en [`src/domain/code-parser.ts`](../src/domain/code-parser.ts).
Las pruebas están en [`code-parser.test.ts`](../src/domain/code-parser.test.ts).

## Formato

```
[equipo] número fundamento calidad [origen] [destino]    acción de un jugador
[equipo] S calidad [origen] [destino]                    saque del jugador en P1 (requiere formación)
[equipo] p                              punto manual
[equipo] T                              tiempo muerto
[equipo] c sale:entra                   cambio de jugador
```

| Parte | Valores | Obligatorio |
|---|---|---|
| equipo | `*` = local · `a` = visitante | No (ver abajo) |
| número | 0–99 (número de camiseta) | Sí, en acciones |
| fundamento | `S` `R` `E` `A` `B` `D` `F` | Sí, en acciones |
| calidad | `#` `+` `!` `-` `/` `=` | Sí, en acciones |
| origen | Zona 1–9 en la cancha propia, o `~` si no se sabe | No |
| destino | Zona 1–9 en la cancha rival | No |
| `p` | Punto manual para ese equipo | — |
| `T` | Tiempo muerto de ese equipo | — |
| `c7:12` | Cambio: sale el 7, entra el 12 (también vale `c7.12`) | — |

Mayúsculas y minúsculas dan igual. Se pueden escribir **varios códigos separados por
espacios** y registrarlos juntos con Enter.

## Equipo cuando no hay prefijo

| Fundamento | Sin prefijo se asigna a... | Por qué |
|---|---|---|
| `S` saque | El equipo que **tiene el saque** | Solo puede sacar quien tiene el saque |
| `R` recepción | El equipo que **recibe** (el otro) | Solo puede recibir el que no saca |
| Todos los demás, `p`, `T` y `c` | El **local** | Pueden ser de cualquiera de los dos |

El prefijo `*` o `a`, si se escribe, **siempre manda**.

Ejemplo: saca el local y su jugador 5 falla el saque.
1. `5S=` → punto para el visitante, que pasa a sacar.
2. `3S+` → como ahora saca el visitante, es el **3 del visitante**. No hace falta escribir `a3S+`.
3. `4R-` → recibe el local: es el **4 del local**.

Si en una misma línea un código termina el rally, los siguientes ya usan el saque nuevo:
en `5S= 3S+`, el `3S+` es del visitante.

## Saque sin número

Con la formación cargada (ver "Rotaciones" en [04 — Reglas de juego](04-reglas-de-juego.md)),
la app sabe quién está en la posición 1, que es quien saca. Entonces alcanza con escribir
`S` y la calidad: `S+`, `S#`, `S=`.

- Sin prefijo, es del equipo que tiene el saque. Con prefijo (`aS+`), del equipo indicado.
- Si ese equipo no tiene formación cargada, se pide el número (ej. `5S+`).
- En una línea con varios códigos, cada `S` usa la rotación del momento:
  en `S+ a3R+ a4A# S-`, el segundo saque es del nuevo P1 del visitante, que acaba de rotar.

## Zonas

Después de la calidad se pueden agregar **una o dos cifras**: la zona de origen y la de
destino (ver "Zonas" en [04 — Reglas de juego](04-reglas-de-juego.md)).

| Código | Significado |
|---|---|
| `7A#47` | Ataque punto del 7 desde zona 4 hacia zona 7 del rival |
| `7A#4` | Ataque punto desde zona 4 (destino sin cargar) |
| `7A#~7` | Ataque punto hacia zona 7 (origen sin cargar) |
| `S+16` | Saque bueno del P1 desde zona 1 hacia zona 6 del rival |
| `a12S=5` | Error de saque del 12 visitante desde zona 5 |

Las zonas van de 1 a 9; un `0` o una tercera cifra dan error. Si están activadas las
**Zonas** en la carga y un saque o ataque se escribe **sin** zonas, aparece la cancha
para marcarlas con el dedo; si ya vienen en el código, no aparece.

## Ejemplos

| Código | Significado |
|---|---|
| `7A#` | Local, jugador 7, ataque punto |
| `*7A#` | Lo mismo (prefijo explícito) |
| `a12R+` | Visitante, jugador 12, recepción buena |
| `4S=` | Jugador 4 del equipo que saca, error de saque |
| `12R+` | Jugador 12 del equipo que recibe, recepción buena |
| `a3B/` | Visitante, jugador 3, invasión en el bloqueo |
| `5F+` | Local, jugador 5, free ball bueno |
| `p` | Punto manual para el local |
| `ap` | Punto manual para el visitante |
| `S+` | Saque bueno del jugador en P1 del equipo que saca (con formación cargada) |
| `S+ 3R- a14A/ 9B#` | Un rally completo sin escribir quién saca |
| `T` / `aT` | Tiempo muerto del local / del visitante |
| `c7:12` | Cambio en el local: sale el 7, entra el 12 |
| `ac3:15` | Cambio en el visitante: sale el 3, entra el 15 |
| `1S+ 3R- a14A/ 9B#` | Un rally completo en una línea (saca el local) |

## Validaciones

Antes de registrar se comprueba:
1. Que el formato sea correcto (si no, se explica qué falta).
2. Que el jugador exista en la plantilla de ese equipo (en un cambio, los dos jugadores).
3. Que en un cambio el que sale y el que entra sean distintos.

Si **cualquiera** de los códigos de una línea es inválido, no se registra **ninguno**, para
no dejar un rally a medias.

Mientras escribes, debajo del campo aparece la interpretación
("Club Norte · #7 Caro · Ataque: Punto") o el error. Si el código es válido pero
probablemente sea un error de carga (por ejemplo, saca el equipo que no tiene el saque),
aparece además un aviso ⚠ en naranja. Ver "Avisos de carga" en
[04 — Reglas de juego](04-reglas-de-juego.md).

## Diferencias con Data Volley

Data Volley usa un código mucho más rico, por ejemplo `*7AH#V5~47C`:

| Parte | Data Volley | VoleyStats v0.4 |
|---|---|---|
| Equipo, número, fundamento, calidad | ✅ | ✅ |
| Tipo de golpe (H alta, M media, Q rápida, T tensa...) | ✅ | ❌ Pendiente |
| Combinación de ataque (V5, X1...) | ✅ | ❌ |
| Zonas de origen/destino (`47`) | ✅ | ✅ (v0.4) |
| Subzonas (`C`) | ✅ | ❌ Pendiente |
| Llamada del armador (K1, K2...) | ✅ | ❌ |
| Tiempos muertos y cambios | ✅ | ✅ (`T`, `c7:12`) |
| Formación y rotaciones | ✅ (con códigos) | ✅ (con botones; sin código) |
| Saque sin número (sacador según rotación) | ✅ | ✅ (`S+`) |

El parser está pensado para **crecer**: las partes nuevas se agregarán al final del
código como opcionales, de modo que `7A#` siga siendo válido.
