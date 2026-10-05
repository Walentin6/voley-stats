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
aparece como *"(mismo punto…)"*. Las dos cuentan en las estadísticas de su fundamento,
y el punto se le acredita a la acción del **equipo que lo ganó** (ace, ataque o bloqueo),
sin importar en qué orden se cargaron. Por ejemplo, en `4A/ a10B#` el punto es del
bloqueador #10, no un "error del rival".

**Excepción:** un saque nunca es espejo de la acción anterior, porque un saque siempre
empieza un rally nuevo. Así, `a2R=` (rally que terminó en error de recepción) seguido de
`5S#` (ace en el rally siguiente) son **dos puntos**.

## Ace por recepción fallada

Como en Data Volley, si después de un saque (que no sea ace ni error) el rival **falla la
recepción** (`R=`), ese saque **cuenta como ace** en las estadísticas:

| Se cargó | El marcador | Las estadísticas |
|---|---|---|
| `5S+ a2R=` | Punto para el que saca (por el `R=`) | El #5 suma 1 ace y 1 punto; el `R=` es "punto de saque", no "error del rival" |

- No se cambia lo guardado: el saque sigue guardado como `S+`. Es una regla de cálculo, así
  que si después se edita o borra el `R=`, el ace desaparece solo.
- Vale aunque haya un tiempo muerto o un cambio en medio, pero no si hubo otra acción.
- En el historial, el saque aparece con *"(cuenta como ace: el rival falló la recepción)"*.

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

## Rotaciones

Implementadas en [`src/domain/rotation.ts`](../src/domain/rotation.ts). Son **opcionales**: si
no se carga la formación, la app funciona como antes (sin rotación ni sacador automático).

### Formación
Al empezar cada set, se cargan los 6 jugadores de cada equipo en su posición:

```
        RED
   P4   P3   P2
   P5   P6   P1   ← P1 saca
```

- La app la propone al empezar cada set, con la formación del set anterior ya puesta.
  Se puede omitir ("Seguir sin formación").
- Se puede cargar o corregir en cualquier momento con el botón **Formación**.
- El **líbero no va en la formación** (ver más abajo).
- Cada set empieza **sin formación**: hay que cargarla de nuevo (o confirmar la propuesta).

### Rotación
- Cuando un equipo **recupera el saque** (gana un rally recibiendo, es decir, un side-out),
  **rota** en sentido horario: el de P2 pasa a P1, el de P3 a P2... y el de P1 a P6.
- El jugador en **P1 saca**. Por eso, con formación cargada, el saque se puede registrar sin
  número (`S+`, o el botón *Saque* sin elegir jugador).
- Si el equipo gana sacando (break-point), no rota.
- Un cambio manual de saque (*⇄ Cambiar saque*) no rota a nadie: es solo una corrección.

### Nombre de cada rotación
- Si en la plantilla hay un jugador marcado como **armador** y está en cancha, la rotación se
  llama por la **posición del armador**: P1 (armador en posición 1) ... P6. Es como lo hace
  Data Volley.
- Si no hay armador, se llaman **R1 ... R6**: R1 es la formación inicial, R2 después de una
  rotación, y así.

### Cambios
- El jugador que entra ocupa **la posición del que sale**.
- Aviso si el que sale no estaba en cancha, o si el que entra ya estaba.

### Líbero
Para no complicar la carga en vivo, **las entradas y salidas del líbero no se registran**
(tampoco cuentan como cambio en el reglamento). Las acciones del líbero se cargan con su
número, como las de cualquiera. La rotación no cambia porque el líbero solo reemplaza a
jugadores de la zona de atrás y nunca saca. Ver
[ADR-006](adr/ADR-006-rotaciones-y-libero.md).

Si se registra un cambio con el líbero, se avisa y no se cuenta.

## Zonas

Implementadas en [`src/domain/zones.ts`](../src/domain/zones.ts). Como en Data Volley, cada
mitad de la cancha tiene **9 zonas**, numeradas desde el punto de vista de **su propio
equipo**, mirando a la red:

```
        RED
   4    3    2      ← adelante (hasta la línea de 3 m)
   7    8    9      ← medio
   5    6    1      ← atrás
```

- Una acción puede tener **zona de origen** (en la cancha propia: desde dónde se saca o se
  ataca) y **zona de destino** (en la cancha rival, con la numeración del rival).
- Ejemplos: un ataque de punta cruzado profundo es **4→5**; por la línea, **4→1**. Un saque
  desde la derecha al centro del fondo es **1→6**.
- Las zonas son **opcionales**: se pueden cargar en todos, algunos o ningún saque o ataque.
- Se cargan con el código (`7A#47`) o con la cancha dibujada (interruptor **Zonas**).
- Por ahora no se usan las subzonas (A–D) de Data Volley.

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
| Saca un jugador que no está en la posición 1 | Con formación: un `S` de alguien que no está en P1 |
| El jugador no está en cancha según la formación | Con formación: acción de un jugador del banco (no aplica al líbero) |
| El jugador que sale no estaba en cancha | Con formación: cambio de alguien que no está jugando |
| El jugador que entra ya estaba en cancha | Con formación: cambio por alguien que ya está jugando |
| Las entradas del líbero no se registran como cambio | Un cambio en el que entra o sale el líbero |

Los avisos aparecen en la vista previa del campo de códigos (antes de registrar) y en el
historial (después).

## Limitaciones conocidas

- **Líbero**: sus entradas y salidas no se registran (ver "Rotaciones").
- **Faltas de rotación**: no se detectan (por ejemplo, un jugador fuera de posición al sacar).
- **Espejos al final del partido**: si el punto que cierra el partido es un ace, ya no se
  puede cargar el `R=` del rival (no hace falta: el punto ya está contado).
