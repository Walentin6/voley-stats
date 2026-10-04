# 09 — Hoja de ruta

Cada etapa produce una versión usable. El orden puede cambiar según lo que pidan los usuarios.

## ✅ Etapa 1 — MVP (v0.1) — *terminada*
- Equipos y plantillas.
- Partido en vivo: botones + códigos, marcador, sets, saque.
- Historial con deshacer/borrar.
- Estadísticas básicas por jugador y set.
- Guardado local, exportación JSON, PWA.

## Etapa 2 — Pulido para uso real (v0.2)
- [ ] Importar un partido desde JSON (restaurar respaldos).
- [ ] Elegir quién saca en el set decisivo.
- [ ] Advertencias de lógica del rally (saque del equipo que no saca, rally sin cerrar).
- [ ] Atajos de teclado globales (enfocar el campo de código desde cualquier lugar).
- [ ] Tiempos muertos y cambios de jugadores (registro simple).
- [ ] Estadísticas de side-out y break-point.
- [ ] Probar en un partido real y ajustar la interfaz según la experiencia.

## Etapa 3 — Rotaciones (v0.3)
- [ ] Formación inicial de cada set (6 jugadores + líbero).
- [ ] Rotación automática al recuperar el saque.
- [ ] Sustituciones y líbero.
- [ ] Al seleccionar acciones, proponer primero a los jugadores en cancha.
- [ ] Estadísticas por rotación (P1–P6).

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
