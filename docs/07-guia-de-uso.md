# 07 — Guía de uso

## 1. Crear los equipos

1. En la pantalla de inicio, pulsa **Equipos** (arriba a la derecha).
2. **+ Nuevo equipo** → escribe el nombre.
3. **+ Agregar jugador** por cada jugador: número, nombre y posición (opcional).
   El líbero se marca con un borde punteado en la pantalla de partido.
4. **Guardar**. Si hay números repetidos o inválidos, se avisa.

Los equipos se reutilizan en todos los partidos.

## 2. Crear un partido

1. Inicio → **+ Nuevo partido**.
2. Elige local y visitante, fecha, competición (opcional), formato (3 o 5 sets),
   quién saca primero y puntos por set.
3. **Empezar partido**.

## 3. Cargar acciones en vivo

La pantalla de partido tiene arriba el **marcador** (el punto amarillo indica quién saca)
y dos pestañas: **Carga** y **Estadísticas**.

### Formación (opcional, recomendada)
Al empezar cada set aparece **Formación del set N**. Para cada equipo:
1. Elige el jugador de cada posición (P1 es el que saca; la red está arriba).
2. Pulsa **Guardar formación**.

A partir del set 2 ya aparece la formación del set anterior: si no cambió, solo pulsa
Guardar. Si no quieres cargarla, pulsa **Seguir sin formación**.

Con la formación cargada:
- Los jugadores se muestran **como en la cancha** (adelante P4 P3 P2, atrás P5 P6 P1) y el
  banco aparte, más chico.
- La etiqueta junto al nombre del equipo (P1…P6) indica la **rotación** actual.
- La app **rota sola** cuando el equipo recupera el saque.
- El **saque** se carga sin elegir jugador: pulsa *Saque* y el resultado, o escribe `S+`.
- Los cambios ponen al que entra en la posición del que sale.

El botón **Formación** de cada equipo permite cargarla más tarde o corregirla.

**Marca al armador** en la plantilla (posición "Armador") para que las rotaciones se llamen
como en Data Volley (P1 = armador en posición 1). El líbero no va en la formación.

### Con botones (táctil)
1. Pulsa el **jugador** (columna izquierda = local, derecha = visitante).
2. Pulsa el **fundamento** (Saque, Recepción, Armado, Ataque, Bloqueo, Defensa, Free ball).
3. Pulsa el **resultado** (`#` `+` `!` `-` `/` `=`). Debajo de cada símbolo aparece su
   significado para ese fundamento.

La acción se registra al pulsar el resultado. El orden de 1 y 2 puede invertirse.

### Con códigos (teclado)
Escribe en el campo superior y pulsa **Enter**:

- `7A#` → local, jugador 7, ataque punto
- `a12R+` → visitante, jugador 12, recepción buena
- `ap` → punto manual para el visitante

**Saque y recepción no necesitan prefijo**: `5S+` es siempre del equipo que tiene el
saque, y `4R-` del equipo que recibe. Mira el punto amarillo del marcador para saber
quién saca.

Puedes escribir un rally entero: `1S+ 3R- a14A/ 9B#`. Guía completa en
[05 — Códigos de scouting](05-codigos-de-scouting.md).

### Zonas (opcional)
Para los mapas y la distribución del ataque, se puede marcar **de dónde salió y a dónde
fue** cada saque y ataque:

- **Con la cancha:** activa el botón **Zonas: Sí** (abajo del panel de botones; la app lo
  recuerda en este dispositivo). Después de cada saque o ataque aparece la cancha:
  1. Toca la **zona de origen** en la cancha del equipo que sacó o atacó.
  2. Toca la **zona de destino** en la cancha rival. La cancha se cierra sola.

  Si no sabes el origen, pulsa **Sin origen →**. Si no quieres marcar nada, pulsa
  **Omitir** o simplemente carga la acción siguiente: la cancha pasa a esa.
- **Con el código:** agrega las zonas al final: `7A#47` (de 4 a 7), `S+16`.
- **Después:** en el editor (✎) de cada acción se pueden poner o corregir las zonas.

Las zonas se numeran desde cada equipo mirando a la red (4-3-2 adelante, 7-8-9 al
medio, 5-6-1 atrás). En la cancha dibujada el local está siempre a la izquierda.

### Puntos sin acción
Usa **+ Punto** (debajo de los jugadores de cada equipo) cuando el rival comete una falta
que no quieres registrar (rotación, red, toque doble...) o cuando te perdiste el rally.

### Tiempos muertos y cambios
Debajo de los jugadores de cada equipo:
- **Tiempo 0/2**: registra un tiempo muerto. El contador es del set actual.
- **Cambio 0/6**: pulsa *Cambio*, después el jugador que **sale** y después el que **entra**.

Con códigos: `T` / `aT` para tiempos muertos, `c7:12` / `ac7:12` para cambios
(sale el 7, entra el 12). Si se pasa el límite del reglamento, el botón se pone naranja
y aparece un aviso, pero se registra igual.

### Set decisivo
Al empezar el set decisivo (5.º o 3.º), la app pregunta **quién saca** según el nuevo
sorteo. Hasta que no lo elijas, la carga queda bloqueada.

### Avisos ⚠
Si algo parece un error de carga (saca el equipo que no tenía el saque, recibe el que
saca, un rally que no terminó en punto...), la acción se registra igual pero aparece un
aviso ⚠ naranja: en la vista previa mientras escribes el código y en el historial.
Lista completa en [04 — Reglas de juego](04-reglas-de-juego.md).

### Corregir errores
- **↶ Deshacer última** (o **Ctrl + Z**): borra la última acción.
- En el **Historial**, el ✎ de cada fila abre el **editor**: cambia el equipo, el jugador,
  el fundamento o el resultado (en un cambio, quién sale y quién entra) y pulsa
  **Guardar cambios** (o Enter; Esc cancela). La acción conserva su lugar en el historial
  y el marcador se recalcula solo.
- La ✕ de cada fila borra esa acción.
- **⇄ Cambiar saque**: si el saque quedó en el equipo equivocado, pásalo al otro.

### Atajos de teclado
| Tecla | Qué hace |
|---|---|
| Cualquier letra o número | Lleva el cursor al campo de códigos (no hace falta hacer clic) |
| **Enter** | Registra lo escrito |
| **Esc** | Borra lo escrito en el campo de códigos |
| **Ctrl + Z** | Deshace la última acción (si el campo de códigos está vacío) |

### ¿Qué registrar como mínimo?
Para estadísticas útiles sin agobiarse, empieza registrando **saque, recepción y
ataque** de cada rally, y los puntos de bloqueo. Defensa y armado son opcionales.

## 4. Ver estadísticas

Pestaña **Estadísticas**. Puedes ver todo el partido o un set concreto.

Arriba de cada tabla están los indicadores del equipo: **puntos ganados**, **side-out**
(% de rallies ganados recibiendo) y **break-point** (% de rallies ganados sacando).
Si se cargó la formación, abajo aparece la tabla **por rotación**.
Significado de cada columna: [06 — Estadísticas](06-estadisticas.md).

## 5. Respaldo

- Todo se guarda **automáticamente** en el navegador después de cada acción. Si cierras
  la ventana, el partido sigue en la lista de inicio.
- **Exportar** (arriba a la derecha en el partido) descarga un archivo `.json` con todo
  el partido. Hazlo al terminar cada partido.
- **Importar** (en la pantalla de inicio) carga un archivo `.json` exportado: sirve para
  restaurar un respaldo o pasar un partido a otro dispositivo. Si el partido ya existe,
  pregunta antes de reemplazarlo. Si el archivo está dañado, explica qué parte falla y no
  toca tus datos.
- ⚠️ Los datos viven en **ese navegador de ese dispositivo**. Si borras los datos del
  navegador o usas modo incógnito, se pierden. Exporta siempre.

## 6. Instalar como app

En Chrome o Edge aparece un ícono de **Instalar** en la barra de direcciones. Una vez
instalada, se abre como una app normal y funciona sin conexión.

Esto funciona con la versión compilada: publicada en internet, o en tu computadora con
`npm run build` y luego `npm run preview`. En modo desarrollo (`npm run dev`) el modo sin
conexión está desactivado a propósito, para que siempre veas los últimos cambios.
