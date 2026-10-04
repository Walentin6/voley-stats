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

### Puntos sin acción
Usa **+ Punto (equipo)** cuando el rival comete una falta que no quieres registrar
(rotación, red, toque doble...) o cuando te perdiste el rally.

### Corregir errores
- **↶ Deshacer última**: borra la última acción.
- En el **Historial**, la ✕ de cada fila borra esa acción. El marcador se recalcula solo.

### ¿Qué registrar como mínimo?
Para estadísticas útiles sin agobiarse, empieza registrando **saque, recepción y
ataque** de cada rally, y los puntos de bloqueo. Defensa y armado son opcionales.

## 4. Ver estadísticas

Pestaña **Estadísticas**. Puedes ver todo el partido o un set concreto.
Significado de cada columna: [06 — Estadísticas](06-estadisticas.md).

## 5. Respaldo

- Todo se guarda **automáticamente** en el navegador después de cada acción. Si cierras
  la ventana, el partido sigue en la lista de inicio.
- **Exportar** (arriba a la derecha en el partido) descarga un archivo `.json` con todo
  el partido. Hazlo al terminar cada partido.
- ⚠️ Los datos viven en **ese navegador de ese dispositivo**. Si borras los datos del
  navegador o usas modo incógnito, se pierden. Exporta siempre.

## 6. Instalar como app

En Chrome o Edge aparece un ícono de **Instalar** en la barra de direcciones. Una vez
instalada, se abre como una app normal y funciona sin conexión.

Esto funciona con la versión compilada: publicada en internet, o en tu computadora con
`npm run build` y luego `npm run preview`. En modo desarrollo (`npm run dev`) el modo sin
conexión está desactivado a propósito, para que siempre veas los últimos cambios.
