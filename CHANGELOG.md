# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las versiones siguen [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado
- **Editar acciones** del historial (botón ✎): equipo, jugador, fundamento y resultado, o los jugadores de un cambio. La acción conserva su lugar y su hora original, y el marcador se recalcula.

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
