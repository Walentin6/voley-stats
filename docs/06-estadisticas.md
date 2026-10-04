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
| Armado | Tot / Err | Total de armados / `E=` |

## Resumen del equipo

- **Puntos ganados**: todos los puntos que ganó el equipo.
- **Por acciones propias**: suma de la columna Pts.
- **Por errores del rival / manuales**: puntos que vinieron de un error del otro equipo
  o de un punto asignado a mano.

> Puntos ganados = Por acciones propias + Por errores del rival / manuales.

## Ejemplo

Un atacante con 10 ataques: 4 puntos (`#`), 1 error (`=`), 1 bloqueado (`/`), 4 seguidos.
- Pts% = 4 / 10 = **40%**
- Ef% = (4 − 1 − 1) / 10 = **20%**

## Próximas estadísticas

- Side-out (% de puntos ganados en recepción) y break-point (% ganados sacando).
  Ya se guarda quién sacaba en cada evento (`servingTeam`), así que es fácil de agregar.
- Rendimiento por rotación (requiere seguir las rotaciones).
- Ataque después de recepción perfecta / mala, contraataque.
- Mapas de dirección (requiere zonas).
