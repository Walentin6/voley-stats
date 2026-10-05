# 06 — Estadísticas

Conteos en [`src/domain/stats.ts`](../src/domain/stats.ts), porcentajes en
[`src/domain/metrics.ts`](../src/domain/metrics.ts).

Se calculan **por jugador** y **por equipo**, para **todo el partido** o **un set**.
Cuando no hay acciones de un fundamento, el porcentaje se muestra como `–`.

## Columnas de la tabla

| Grupo | Columna | Cálculo |
|---|---|---|
| — | **Pts** | Puntos propios = `S#` + `A#` + `B#` (sin contar espejos) |
| Saque | Tot | Total de saques |
| | Ace | `S#` |
| | Err | `S=` |
| | **Ef%** | (Ace − Err) / Tot |
| Recepción | Tot | Total de recepciones |
| | Err | `R=` |
| | **Pos%** | (`R#` + `R+`) / Tot — recepción positiva |
| | **Perf%** | `R#` / Tot — recepción perfecta |
| Ataque | Tot | Total de ataques |
| | Pts | `A#` |
| | Err | `A=` |
| | Bloq | `A/` (bloqueado) |
| | **Pts%** | `A#` / Tot |
| | **Ef%** | (`A#` − `A=` − `A/`) / Tot |
| Bloqueo | Pts | `B#` |
| Defensa | Tot / Err | Total de defensas / `D=` |
| Free ball | Tot / Err | Total de free balls recibidos / `F=` |
| Armado | Tot / Err | Total de armados / `E=` |

## Resumen del equipo

- **Puntos ganados**: todos los puntos que ganó el equipo.
- **Por acciones propias**: suma de la columna Pts.
- **Por errores del rival / manuales**: puntos que vinieron de un error del otro equipo
  o de un punto asignado a mano.

> Puntos ganados = Por acciones propias + Por errores del rival / manuales.

## Side-out y break-point

Son los dos indicadores más usados para saber **dónde** gana o pierde puntos un equipo.
Cada rally lo juega un equipo **sacando** y el otro **recibiendo**:

| Indicador | Fórmula | Qué mide |
|---|---|---|
| **Side-out** | rallies ganados recibiendo / rallies jugados recibiendo | Capacidad de recuperar el saque |
| **Break-point** | rallies ganados sacando / rallies jugados sacando | Capacidad de sumar puntos seguidos |

Como referencia, en vóley de alto nivel el side-out suele estar entre 60% y 70% y el
break-point entre 30% y 40%.

Detalles:
- Un rally termina con cada evento que da un punto (acción o punto manual). Los espejos
  no cuentan como rally nuevo.
- Quién sacaba se toma de `servingTeam`, calculado al reproducir los eventos.

## Por rotación

Si se cargó la formación, debajo de la tabla de jugadores aparece una tabla **por rotación**
(P1–P6 según la posición del armador, o R1–R6 si no hay armador marcado):

| Columna | Cálculo |
|---|---|
| Side-out | rallies ganados recibiendo / rallies jugados recibiendo, en esa rotación |
| Break-point | rallies ganados sacando / rallies jugados sacando, en esa rotación |
| Saldo | puntos ganados − puntos perdidos en esa rotación |

La rotación de cada rally es la que tenía el equipo **cuando se jugó** (antes de rotar por
ese punto). Los rallies sin formación cargada no entran en esta tabla.

Sirve para ver en qué rotación sufre el equipo: por ejemplo, un saldo de −6 en P4 indica
que conviene revisar la recepción o el ataque en esa rotación.

## Ejemplo

Un atacante con 10 ataques: 4 puntos (`#`), 1 error (`=`), 1 bloqueado (`/`), 4 seguidos.
- Pts% = 4 / 10 = **40%**
- Ef% = (4 − 1 − 1) / 10 = **20%**

## Próximas estadísticas

- Por rotación: también recepción y ataque de cada rotación.
- Ataque después de recepción perfecta / mala, contraataque.
- Mapas de dirección (requiere zonas).
