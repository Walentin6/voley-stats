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
| `F` | Free ball (*freeball*) |

Las letras son las mismas que usa Data Volley.

**Free ball**: se registra al jugador que **recibe** una pelota fácil del rival (una
pelota que pasa sin ataque, de antebrazos o de dedos). Se evalúa como una recepción:
qué tan bien quedó la pelota para armar el contraataque.

## Calidades

De mejor a peor. El significado exacto depende del fundamento:

| Calidad | Saque | Recepción | Armado | Ataque | Bloqueo | Defensa | Free ball |
|---|---|---|---|---|---|---|---|
| `#` | Ace | Perfecta | Perfecto | **Punto** | **Punto** | Perfecta | Perfecta |
| `+` | Bueno | Buena | Bueno | Bueno | Bueno | Buena | Buena |
| `!` | Regular | Regular | Regular | Regular | Regular | Regular | Regular |
| `-` | Malo | Mala | Malo | Malo | Malo | Mala | Mala |
| `/` | Rival devuelve | Devuelve | Muy malo | **Bloqueado** | **Invasión** | Devuelve | Devuelve |
| `=` | **Error** | **Error** | **Error** | **Error** | **Error** | **Error** | **Error** |

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
- **Set decisivo**: como el reglamento indica un nuevo sorteo, al empezar ese set la app
  **pregunta quién saca** y no deja cargar nada hasta elegirlo. La elección se guarda como
  un evento de cambio de saque (`serve`).
- **Cambio manual de saque**: el botón *⇄ Cambiar saque* pasa el saque al otro equipo.
  Sirve para corregir errores (por ejemplo, si se eligió mal quién sacaba primero). También
  queda guardado como evento, así que se puede deshacer.

## Tiempos muertos y cambios

- Se registran por equipo y se cuentan **por set** (el contador vuelve a 0 en cada set).
- Límites del reglamento FIVB: **2 tiempos muertos** y **6 cambios** por set y por equipo.
- Pasar el límite **no se impide** (hay competiciones con otras reglas), pero se muestra un
  aviso y el botón se pinta de naranja.
- No afectan al marcador ni al saque.
- Como todavía no se siguen las rotaciones, un cambio solo queda anotado (quién sale y quién
  entra); no se comprueba que el que sale estuviera en cancha.

## Avisos de carga

La app revisa cada acción y marca con ⚠ las que probablemente sean un error. **Nunca impide
registrar**: solo avisa, porque en un partido real hay situaciones raras y el estadístico
manda (ver [ADR-005](adr/ADR-005-avisos-no-bloqueantes.md)).

| Aviso | Cuándo aparece |
|---|---|
| Saca el equipo que no tenía el saque | Un `S` del equipo que no saca |
| El rally anterior no terminó en punto | Un `S` cuando el rally anterior tuvo acciones pero ninguna terminó en punto |
| Recibe el mismo equipo que saca | Un `R` del equipo que saca |
| Más de 2 tiempos muertos en el set | Tercer tiempo muerto (o más) de un equipo en el set |
| Más de 6 cambios en el set | Séptimo cambio (o más) de un equipo en el set |

Los avisos aparecen en la vista previa del campo de códigos (antes de registrar) y en el
historial (después).

## Limitaciones conocidas

- **Rotaciones y líbero**: no se siguen todavía.
- **Espejos al final del partido**: si el punto que cierra el partido es un ace, ya no se
  puede cargar el `R=` del rival (no hace falta: el punto ya está contado).
