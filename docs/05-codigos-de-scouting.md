# 05 — Códigos de scouting

Implementado en [`src/domain/code-parser.ts`](../src/domain/code-parser.ts).
Las pruebas están en [`code-parser.test.ts`](../src/domain/code-parser.test.ts).

## Formato

```
[equipo] número fundamento calidad
[equipo] p
```

| Parte | Valores | Obligatorio |
|---|---|---|
| equipo | `*` = local · `a` = visitante | No (si se omite: **local**) |
| número | 0–99 (número de camiseta) | Sí, salvo en puntos manuales |
| fundamento | `S` `R` `E` `A` `B` `D` | Sí |
| calidad | `#` `+` `!` `-` `/` `=` | Sí |
| `p` | Punto manual para ese equipo | — |

Mayúsculas y minúsculas dan igual. Se pueden escribir **varios códigos separados por
espacios** y registrarlos juntos con Enter.

## Ejemplos

| Código | Significado |
|---|---|
| `7A#` | Local, jugador 7, ataque punto |
| `*7A#` | Lo mismo (prefijo explícito) |
| `a12R+` | Visitante, jugador 12, recepción buena |
| `4S=` | Local, jugador 4, error de saque |
| `a3B/` | Visitante, jugador 3, invasión en el bloqueo |
| `p` | Punto manual para el local |
| `ap` | Punto manual para el visitante |
| `1S+ a3R- a14A/ 9B#` | Un rally completo en una línea |

## Validaciones

Antes de registrar se comprueba:
1. Que el formato sea correcto (si no, se explica qué falta).
2. Que el jugador exista en la plantilla de ese equipo.

Si **cualquiera** de los códigos de una línea es inválido, no se registra **ninguno**, para
no dejar un rally a medias.

Mientras escribes, debajo del campo aparece la interpretación
("Club Norte · #7 Caro · Ataque: Punto") o el error.

## Diferencias con Data Volley

Data Volley usa un código mucho más rico, por ejemplo `*7AH#V5~47C`:

| Parte | Data Volley | VoleyStats v0.1 |
|---|---|---|
| Equipo, número, fundamento, calidad | ✅ | ✅ |
| Tipo de golpe (H alta, M media, Q rápida, T tensa...) | ✅ | ❌ Próxima etapa |
| Combinación de ataque (V5, X1...) | ✅ | ❌ |
| Zonas de origen/destino (`47`) y subzonas (`C`) | ✅ | ❌ Etapa "cancha" |
| Llamada del armador (K1, K2...) | ✅ | ❌ |
| Códigos de rotación, cambios, tiempos | ✅ | ❌ Etapa "rotaciones" |

El parser está pensado para **crecer**: las partes nuevas se agregarán al final del
código como opcionales, de modo que `7A#` siga siendo válido.
