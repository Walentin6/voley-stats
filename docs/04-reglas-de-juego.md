# 04 — Reglas de juego

Implementadas en [`src/domain/skills.ts`](../src/domain/skills.ts) y
[`src/domain/match-state.ts`](../src/domain/match-state.ts).

## Fundamentos

| Código | Fundamento |
|---|---|
| `S` | Saque (*serve*) |
| `R` | Recepción (*reception*) |
| `E` | Armado / colocación (*set*) |
| `A` | Ataque (*attack*) |
| `B` | Bloqueo (*block*) |
| `D` | Defensa (*dig*) |

Las letras son las mismas que usa Data Volley.

## Calidades

De mejor a peor. El significado exacto depende del fundamento:

| Calidad | Saque | Recepción | Armado | Ataque | Bloqueo | Defensa |
|---|---|---|---|---|---|---|
| `#` | Ace | Perfecta | Perfecto | **Punto** | **Punto** | Perfecta |
| `+` | Bueno | Buena | Bueno | Bueno | Bueno | Buena |
| `!` | Regular | Regular | Regular | Regular | Regular | Regular |
| `-` | Malo | Mala | Malo | Malo | Malo | Mala |
| `/` | Rival devuelve | Devuelve | Muy malo | **Bloqueado** | **Invasión** | Devuelve |
| `=` | **Error** | **Error** | **Error** | **Error** | **Error** | **Error** |

En **negrita**, las que terminan el rally.

## ¿Quién gana el punto?

| Acción | Punto para |
|---|---|
| Cualquier `=` (error) | El rival |
| `S#` (ace), `A#` (ataque punto), `B#` (bloqueo punto) | El equipo que hizo la acción |
| `A/` (ataque bloqueado) | El rival (el que bloqueó) |
| `B/` (invasión en el bloqueo) | El rival |
| Punto manual (`p` / `ap`) | El equipo indicado |
| Todo lo demás | Nadie: el rally sigue |

## Acciones "espejo"

Algunas jugadas pueden registrarse desde los dos lados. Por ejemplo, un ace es a la vez
`S#` del que saca y `R=` del que recibe. Si el estadístico registra **las dos seguidas**,
el punto se cuenta **una sola vez**:

| Acción | Espejo |
|---|---|
| `S#` ace | `R=` error de recepción del rival |
| `A#` ataque punto | `D=` defensa fallada del rival |
| `A#` ataque punto | `B=` bloqueo fallado del rival |
| `A/` ataque bloqueado | `B#` bloqueo punto del rival |

Condiciones: las dos acciones son de **equipos distintos**, forman uno de estos pares
(en cualquier orden) y van **una justo después de la otra**. En el historial, la segunda
aparece como *"(mismo punto, no suma)"*. Las dos cuentan en las estadísticas de su
fundamento, pero el punto lo tiene solo la primera.

## Sets y partido

- Un set se gana al llegar a `pointsPerSet` (25) con **al menos 2 puntos de diferencia**
  (no hay tope: 30-28 es válido).
- El set decisivo (el 5.º en un partido al mejor de 5, el 3.º en uno al mejor de 3) se
  juega a `pointsTiebreak` (15).
- Gana el partido quien gana 3 sets (al mejor de 5) o 2 sets (al mejor de 3).
- Las acciones registradas después del final no suman (la interfaz ya no permite cargarlas).

## Saque

- En el set 1 saca el equipo elegido al crear el partido.
- Quien gana un punto, saca el siguiente.
- Al empezar cada set nuevo, el saque inicial se **alterna** (set 2 lo empieza el otro
  equipo, set 3 el primero, etc.).

## Limitaciones conocidas

- **Saque del set decisivo**: el reglamento indica un nuevo sorteo; por ahora se alterna
  como en los demás sets. (Pendiente: permitir elegirlo.)
- **No se valida la lógica del rally**: la app no impide, por ejemplo, registrar un saque
  del equipo que no saca. Se mostrará como advertencia en una versión futura.
- **Rotaciones y líbero**: no se siguen todavía.
- **Espejos al final del partido**: si el punto que cierra el partido es un ace, ya no se
  puede cargar el `R=` del rival (no hace falta: el punto ya está contado).
