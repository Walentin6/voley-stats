# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las versiones siguen [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

## [0.4.0] — 2026-10-05

Cancha y zonas.

### Agregado
- **Zonas 1–9** de origen y destino para cada acción, con la numeración de Data Volley (opcionales).
- **Zonas en los códigos**: `7A#47` (de 4 a 7), `7A#4`, `7A#~7` (solo destino), `S+16`.
- **Cancha dibujada para marcar zonas**: con el interruptor "Zonas: Sí", después de cada saque o ataque aparece la cancha para tocar origen y destino. No bloquea la carga. La preferencia se recuerda en el dispositivo.
- Zonas en el **editor de acciones** y en el historial (ej. "(4→7)").
- **Distribución del ataque por zona**: desde qué zonas ataca el equipo, con Pts% y Ef%, y el reparto según recepción positiva, negativa y contraataque.
- **Mapas de saque y ataque**: líneas de origen a destino coloreadas por resultado, cantidades por zona y filtro por jugador.

### Cambiado
- Pruebas automáticas: de 91 a 97.

## [0.3.2] — 2026-10-05

Estadísticas al estilo del informe de Data Volley 4.

### Agregado
- Pestaña de estadísticas reorganizada como el informe de Data Volley: se elige el equipo y el set, y se ven todas las secciones.
- Por jugador: **sets jugados**, **BP** (puntos ganados sacando) y **V-P** (puntos − errores).
- **Por set**: marcador, duración, puntos de ace, ataque, bloqueo y errores del rival, side-out y break-point.
- **Ataque por fase**: después de recepción (K1, separado por recepción positiva y negativa) y contraataque (K2).
- **Side-out según la recepción**: % de rallies ganados según la calidad de la recepción.
- **Puntos regalados**: errores que le dieron el punto al rival, por tipo.
- Indicador "Puntos regalados" junto a side-out y break-point.

### Cambiado
- El orden de las columnas de saque, recepción y ataque sigue el de Data Volley (Tot, Err, ...).
- En un par espejo, el punto se le acredita a la acción del equipo que lo ganó. Antes, en `4A/ a10B#` el punto quedaba como "error del rival" y el bloqueador no sumaba.
- El servidor de desarrollo revisa los archivos periódicamente (en Windows a veces no detectaba los cambios).
- Pruebas automáticas: de 79 a 91.

## [0.3.1] — 2026-10-05

### Agregado
- Columna **Pos%** de saque: (aces + `S+` + `S/`) / total.
- **Ace por recepción fallada** (como en Data Volley): un saque seguido de un `R=` del rival cuenta como ace en las estadísticas y su punto es del sacador, no "error del rival". Se indica en el historial.

### Corregido
- Un ace (`S#`) justo después de un rally que terminó en error de recepción (`R=`) se tomaba como "el mismo punto" y no sumaba al marcador. Un saque ya no puede ser espejo de la acción anterior.

## [0.3.0] — 2026-10-04

Rotaciones.

### Agregado
- **Editar acciones** del historial (botón ✎): equipo, jugador, fundamento y resultado, o los jugadores de un cambio. La acción conserva su lugar y su hora original, y el marcador se recalcula.
- **Formación** de cada set (opcional): editor con la cancha dibujada (P1–P6); se propone al empezar cada set con la formación anterior; botón **Formación** para cargarla o corregirla en cualquier momento.
- **Rotación automática** al recuperar el saque, con la rotación actual (P1–P6 según el armador, o R1–R6) junto al nombre del equipo.
- **Sacador automático**: con formación, `S+` (o *Saque* → resultado con botones) registra el saque del jugador en P1.
- **Cancha en los botones**: titulares por posición y banco aparte.
- Los **cambios** ponen al que entra en la posición del que sale.
- **Estadísticas por rotación**: side-out, break-point y saldo de cada rotación.
- Nuevos avisos: sacador fuera de P1, jugador que no está en cancha, cambios imposibles, cambio con el líbero.
- ADR-006: rotaciones opcionales y líbero sin seguimiento.

### Cambiado
- La pregunta del saque en el set decisivo ya no desaparece al cargar formaciones, tiempos o cambios: solo al elegir el saque o empezar a jugar.
- Pruebas automáticas: de 48 a 71.

## [0.2.0] — 2026-10-04

Pulido para uso en partidos reales.

### Agregado
- Fundamento **Free ball** (`F`), como en Data Volley: botón, código (`5F+`), columnas en estadísticas y error `F=` que da punto al rival.
- **Set decisivo**: la app pregunta quién saca (nuevo sorteo) antes de dejar cargar.
- Botón **⇄ Cambiar saque** para corregir quién tiene el saque.
- **Tiempos muertos** y **cambios** con botones y códigos (`T`, `aT`, `c7:12`), con contador por set (2 tiempos y 6 cambios, reglamento FIVB).
- **Avisos de carga** ⚠ (no bloquean): saque del equipo que no saca, recepción del equipo que saca, rally sin terminar, límite de tiempos y cambios. Se ven en la vista previa y en el historial.
- Estadísticas de **side-out** y **break-point** por equipo.
- **Importar** un partido desde un respaldo JSON, con validación del archivo.
- **Atajos de teclado**: escribir en cualquier lugar lleva al campo de códigos, Ctrl+Z deshace, Esc borra el campo.
- ADR-005: los avisos de carga no bloquean.

### Cambiado
- Los códigos de **saque** sin prefijo se asignan al equipo que tiene el saque, y los de **recepción** al que recibe (antes, todo código sin prefijo era del local). En una línea con varios códigos, cada uno usa el saque del momento.
- Los botones de punto de cada equipo ahora dicen solo "+ Punto" y están junto a los de tiempo y cambio.
- Pruebas automáticas: de 21 a 48.

## [0.1.0] — 2026-10-03

Primera versión (MVP).

### Agregado
- Gestión de equipos y plantillas (número, nombre, posición) con validación de números repetidos.
- Creación de partidos: equipos, fecha, competición, al mejor de 3/5, puntos por set y del set decisivo, saque inicial.
- Carga en vivo con botones (jugador → fundamento → resultado) y con códigos de teclado (`7A#`, `a12R+`, `ap`), incluso varios códigos a la vez.
- Marcador, sets, saque y final del partido calculados a partir de los eventos.
- Detección de acciones "espejo" (ej. `S#` + `R=` del rival) para no contar el punto dos veces.
- Deshacer la última acción y borrar cualquier acción del historial.
- Estadísticas por jugador y equipo (todo el partido o por set).
- Guardado automático en el navegador después de cada acción.
- Exportación del partido a JSON.
- App instalable que funciona sin conexión (PWA).
- Pruebas automáticas de la lógica del dominio (21 pruebas).
- Documentación completa en `docs/`.
