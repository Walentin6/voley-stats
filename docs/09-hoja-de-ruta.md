# 09 — Hoja de ruta

Cada etapa produce una versión usable. El orden puede cambiar según lo que pidan los usuarios.

## ✅ Etapa 1 — MVP (v0.1) — *terminada*
- Equipos y plantillas.
- Partido en vivo: botones + códigos, marcador, sets, saque.
- Historial con deshacer/borrar.
- Estadísticas básicas por jugador y set.
- Guardado local, exportación JSON, PWA.

## ✅ Etapa 2 — Pulido para uso real (v0.2) — *terminada*
- [x] Fundamento free ball (`F`).
- [x] Saque y recepción sin prefijo asignados automáticamente.
- [x] Importar un partido desde JSON (restaurar respaldos).
- [x] Elegir quién saca en el set decisivo, y botón para corregir el saque.
- [x] Avisos de lógica del rally (saque del equipo que no saca, rally sin cerrar...).
- [x] Atajos de teclado (enfocar el campo de código, Ctrl+Z, Esc).
- [x] Tiempos muertos y cambios de jugadores (registro simple).
- [x] Estadísticas de side-out y break-point.
- [ ] Probar en un partido real y ajustar la interfaz según la experiencia. *(pendiente del usuario)*
- [ ] Publicar la app en internet para usarla en celular/tablet. *(por ahora no: decisión del usuario)*

## ✅ Etapa 3 — Rotaciones (v0.3) — *terminada*
- [x] Editar acciones del historial.
- [x] Formación de cada set (opcional, propone la del set anterior).
- [x] Rotación automática al recuperar el saque.
- [x] Sacador automático (jugador en P1): `S+` y botón *Saque* sin elegir jugador.
- [x] Cambios que respetan la posición; avisos de cambios imposibles.
- [x] Líbero: sus acciones se cargan normal; sus entradas no se registran (ADR-006).
- [x] Cancha dibujada en los botones (titulares por posición, banco aparte).
- [x] Estadísticas por rotación (P1–P6 / R1–R6).
- [ ] Registrar entradas y salidas del líbero (si hace falta en el futuro).
- [ ] Recepción y ataque por rotación.

## ✅ Estadísticas estilo Data Volley (v0.3.1 – v0.3.2) — *terminada*
- [x] Ace por recepción fallada, Pos% de saque.
- [x] Por jugador: sets jugados, BP, V-P.
- [x] Resumen por set (marcador, duración, origen de los puntos, side-out y break-point).
- [x] Ataque por fase: K1 (por recepción positiva/negativa) y contraataque.
- [x] Side-out según la calidad de recepción.
- [x] Puntos regalados por tipo de error.
- [x] El punto de un par espejo se acredita a la acción del equipo que lo ganó.

## Etapa 4 — Cancha y zonas (v0.4)
- [ ] Marcar zona de origen y destino haciendo clic en un dibujo de la cancha.
- [ ] Ampliar los códigos: tipo de golpe, zonas, subzonas (compatible con Data Volley).
- [ ] Mapas de dirección de saque y ataque.
- [ ] Distribución del armador.

## Etapa 5 — Almacenamiento serio (v0.5)
- [ ] Migrar de localStorage a IndexedDB (más capacidad, temporadas completas).
- [ ] Estadísticas acumuladas de varios partidos (temporada, jugador).

## Etapa 6 — Video (v0.6)
- [ ] Cargar el video del partido y sincronizarlo con los eventos.
- [ ] Saltar al momento exacto de cada acción.
- [ ] Listas de reproducción por filtro ("todos los ataques del 7 desde zona 4").

## Etapa 7 — Informes y compatibilidad (v0.7)
- [ ] Informe del partido en PDF.
- [ ] Exportar a Excel/CSV.
- [ ] Importar y exportar archivos `.dvw` de Data Volley.

## Etapa 8 — Producto (v1.0)
- [ ] Cuentas de usuario y sincronización en la nube.
- [ ] Compartir partidos con el cuerpo técnico.
- [ ] Publicación en internet (hosting) y dominio propio.
- [ ] Varios idiomas.
