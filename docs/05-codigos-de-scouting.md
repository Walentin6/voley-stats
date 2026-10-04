# 05 — Códigos de scouting

Implementado en [`src/domain/code-parser.ts`](../src/domain/code-parser.ts).
Las pruebas están en [`code-parser.test.ts`](../src/domain/code-parser.test.ts).

## Formato

```
[equipo] número fundamento calidad      acción de un jugador
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

| Parte | Data Volley | VoleyStats v0.2 |
|---|---|---|
| Equipo, número, fundamento, calidad | ✅ | ✅ |
| Tipo de golpe (H alta, M media, Q rápida, T tensa...) | ✅ | ❌ Próxima etapa |
| Combinación de ataque (V5, X1...) | ✅ | ❌ |
| Zonas de origen/destino (`47`) y subzonas (`C`) | ✅ | ❌ Etapa "cancha" |
| Llamada del armador (K1, K2...) | ✅ | ❌ |
| Tiempos muertos y cambios | ✅ | ✅ (`T`, `c7:12`) |
| Códigos de rotación y formación | ✅ | ❌ Etapa "rotaciones" |

El parser está pensado para **crecer**: las partes nuevas se agregarán al final del
código como opcionales, de modo que `7A#` siga siendo válido.
