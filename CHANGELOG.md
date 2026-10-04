# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las versiones siguen [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

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
