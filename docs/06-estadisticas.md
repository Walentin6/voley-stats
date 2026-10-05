# 06 — Estadísticas

La pestaña **Estadísticas** sigue la estructura del informe de partido de Data Volley 4.
Arriba se elige el **equipo** y si se ve **todo el partido o un set**.

Código: conteos por jugador en [`src/domain/stats.ts`](../src/domain/stats.ts), análisis
por set, fase y recepción en [`src/domain/report.ts`](../src/domain/report.ts), agrupación
en rallies en [`src/domain/rallies.ts`](../src/domain/rallies.ts) y porcentajes en
[`src/domain/metrics.ts`](../src/domain/metrics.ts).

Cuando no hay acciones para calcular un porcentaje, se muestra `–`.

## Secciones

| Sección | Qué muestra |
|---|---|
| Indicadores | Puntos ganados, side-out, break-point y puntos regalados |
| Jugadores | La tabla principal del informe (ver abajo) |
| Por set | Marcador, duración y de dónde salieron los puntos en cada set |
| Ataque por fase | Ataque después de recepción (K1) y contraataque (K2) |
| Side-out según la recepción | % de rallies ganados según cómo se recibió |
| Por rotación | Side-out, break-point y saldo de cada rotación (con formación) |
| Puntos regalados | Errores que le dieron el punto al rival, por tipo |

## Jugadores

| Grupo | Columna | Cálculo |
|---|---|---|
| — | **Sets** | Sets jugados: estuvo en la formación, entró con un cambio o tuvo alguna acción |
| Puntos | **Tot** | Puntos propios = aces + ataques punto (`A#`) + bloqueos punto (`B#`) |
| | **BP** | De esos puntos, los ganados mientras su equipo **sacaba** (break-point) |
| | **V-P** | Puntos − errores que dieron punto al rival (ganados − perdidos) |
| Saque | Tot | Total de saques |
| | Err | `S=` |
| | Ace | `S#`, más los saques seguidos de un `R=` del rival |
| | **Pos%** | (Ace + `S+` + `S/`) / Tot — saques que complicaron la recepción |
| | **Ef%** | (Ace − Err) / Tot |
| Recepción | Tot | Total de recepciones |
| | Err | `R=` |
| | **Pos%** | (`R#` + `R+`) / Tot — recepción positiva |
| | **Perf%** | `R#` / Tot — recepción perfecta |
| Ataque | Tot | Total de ataques |
| | Err | `A=` |
| | Bloq | `A/` (le bloquearon el ataque) |
| | Pts | `A#` |
| | **Pts%** | `A#` / Tot |
| | **Ef%** | (`A#` − `A=` − `A/`) / Tot |
| Bloqueo | Pts | Puntos de bloqueo (`B#`) |
| Otros | Def / FB / Arm | Total / errores de defensa, free ball y armado |

**Errores que dan punto al rival** (para V-P y "Puntos regalados"): todos los `=` (de
cualquier fundamento), el ataque bloqueado (`A/`) y la invasión en el bloqueo (`B/`).

Los jugadores que no jugaron en lo que se está mirando aparecen en gris.

## Cómo leer las estadísticas de saque

Cada saque se evalúa según lo difícil que se lo puso al rival:

| Código | Significado | Para el que saca |
|---|---|---|
| `S#` | Ace | ✅ Punto directo |
| `S/` | El rival devuelve la pelota | ✅ Muy bueno |
| `S+` | Bueno: el rival recibe mal | ✅ Positivo |
| `S!` | Regular: el rival arma con opciones limitadas | ➖ Neutro |
| `S-` | Malo: el rival recibe perfecto | ❌ Negativo |
| `S=` | Error | ❌ Punto para el rival |

- **Ef%** solo suma los aces y resta los errores. Un saque que entra sin ser ace es
  **neutro**: con un solo `S+`, la Ef% da **0%** (no sumó ni restó, no es un error).
  Un valor negativo (por ejemplo −20%) significa más errores que aces.
- **Pos%** mide cuántos saques complicaron al rival, aunque no fueran ace.

## A quién se le acredita cada punto

| Situación | El punto es de... |
|---|---|
| `S#` (con o sin `R=` del rival) | El sacador (ace) |
| Saque `S+`/`S!`/... seguido de `R=` del rival | El sacador: cuenta como **ace** (como en Data Volley) |
| `A#` (con o sin `D=` o `B=` del rival) | El atacante |
| `B#`, se cargue antes o después del `A/` del rival | El bloqueador |
| Cualquier otro error del rival | "Error del rival" (no es punto de ningún jugador) |
| Punto manual (`p`) | "Error del rival" / otros |

Ver también "Acciones espejo" y "Ace por recepción fallada" en
[04 — Reglas de juego](04-reglas-de-juego.md).

## Indicadores del equipo

- **Puntos ganados** = puntos propios (suma de la columna Tot) + puntos por errores del
  rival o asignados a mano.
- **Side-out** y **break-point**: ver abajo.
- **Puntos regalados**: total de errores que le dieron el punto al rival.

## Side-out y break-point

Cada rally lo juega un equipo **sacando** y el otro **recibiendo**:

| Indicador | Fórmula | Qué mide |
|---|---|---|
| **Side-out** | rallies ganados recibiendo / rallies jugados recibiendo | Capacidad de recuperar el saque |
| **Break-point** | rallies ganados sacando / rallies jugados sacando | Capacidad de sumar puntos seguidos |

Como referencia, en vóley de alto nivel el side-out suele estar entre 60% y 70% y el
break-point entre 30% y 40%.

Un rally termina con cada evento que da un punto (acción o punto manual). Los espejos no
cuentan como rally nuevo.

## Por set

| Columna | Cálculo |
|---|---|
| Marcador | Puntos del equipo − puntos del rival en el set |
| Duración | Minutos entre la primera y la última acción registrada del set |
| Ace / Ataque / Bloqueo | Puntos propios de cada tipo |
| Err. rival | Puntos por errores del rival o asignados a mano |
| Side-out / Break-point | Como arriba, pero solo de ese set (con ganados/jugados) |

La duración solo es real si se carga en vivo; si se carga desde un video, depende de la
velocidad de carga.

## Ataque por fase

Data Volley separa el ataque según la fase del juego:

| Fase | Cuál es |
|---|---|
| **Después de recepción (K1)** | El **primer ataque** del equipo que **recibe**, antes de que el rival vuelva a tocar la pelota. Es el ataque de side-out. |
| ↳ con recepción positiva | K1 cuando la recepción fue `#` o `+` |
| ↳ con recepción negativa | K1 cuando la recepción fue `!`, `-` o `/` |
| **Contraataque (K2)** | Cualquier otro ataque: después de defender, después de un free ball, o del equipo que sacaba |

Columnas: Tot, Err, Bloq, Pts, Pts% y Ef%, como en la tabla de jugadores.

Ejemplo: `1S+ a2R# a4A+ 3D+ 4A#` → el ataque del 4 visitante es **K1 con recepción
positiva**; el del 4 local es **contraataque**.

Para que esta tabla sea completa, hay que cargar la **recepción** y los **ataques** de cada
rally. Si falta la recepción, el ataque cuenta como K1 pero no entra en "positiva" ni
"negativa".

## Side-out según la recepción

Para cada calidad de recepción, cuántos rallies jugó el equipo recibiendo y cuántos ganó.
Muestra cuánto depende el equipo de recibir bien: por ejemplo, 80% de side-out con
recepción `#` y 35% con recepción `-`. Los rallies en los que no se cargó la recepción
aparecen aparte ("Sin recepción cargada").

## Por rotación

Si se cargó la formación, aparece una tabla **por rotación** (P1–P6 según la posición del
armador, o R1–R6 si no hay armador marcado):

| Columna | Cálculo |
|---|---|
| Side-out | rallies ganados recibiendo / rallies jugados recibiendo, en esa rotación |
| Break-point | rallies ganados sacando / rallies jugados sacando, en esa rotación |
| Saldo | puntos ganados − puntos perdidos en esa rotación |

La rotación de cada rally es la que tenía el equipo **cuando se jugó** (antes de rotar por
ese punto). Los rallies sin formación cargada no entran en esta tabla.

## Puntos regalados

Errores que le dieron el punto al rival, por tipo: saque (`S=`), recepción (`R=`), ataque
(`A=`), ataque bloqueado (`A/`), bloqueo (`B=` y `B/`), armado (`E=`), defensa (`D=`), free
ball (`F=`) y "otros" (puntos asignados a mano al rival). Con el % sobre el total.

## Ejemplo de cálculo

Un atacante con 10 ataques: 4 puntos (`#`), 1 error (`=`), 1 bloqueado (`/`), 4 seguidos.
- Pts% = 4 / 10 = **40%**
- Ef% = (4 − 1 − 1) / 10 = **20%**

## Diferencias con Data Volley que quedan

| Data Volley 4 | VoleyStats |
|---|---|
| Tipo de ataque (combinaciones, zonas) y distribución del armador | ❌ Requiere zonas (etapa 4) |
| Mapas de dirección de saque y ataque | ❌ Etapa 4 |
| Estadísticas de varios partidos (temporada) | ❌ Etapa 5 |
| Informe imprimible (PDF) | ❌ Etapa 7 |
| Marcadores parciales y "voto" del jugador | ❌ |
