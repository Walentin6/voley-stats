# ADR-001 — Aplicación web instalable (PWA)

- Estado: Aceptada
- Fecha: 2026-10-03

## Contexto
Queremos un producto general (muchos equipos y usuarios), usable **en vivo** en
gimnasios donde a menudo no hay internet, en computadoras, tablets y celulares. El
autor tiene poca experiencia programando, así que la tecnología debe ser popular, con
mucha documentación y fácil de ejecutar.

## Decisión
Construir una **aplicación web** con TypeScript + React + Vite, convertida en **PWA**
(instalable y con funcionamiento sin conexión) mediante `vite-plugin-pwa`.

## Alternativas consideradas
- **App de escritorio (Python + Qt, Electron)**: solo para computadoras, distribución más
  difícil (instaladores por sistema operativo).
- **App móvil nativa (Android/iOS)**: dos plataformas, publicación en tiendas, curva de
  aprendizaje alta.
- **Web tradicional con servidor**: requiere internet en el gimnasio.

## Consecuencias
- ✅ Un solo código para todos los dispositivos; se comparte con un enlace.
- ✅ Funciona sin conexión una vez cargada.
- ✅ El reproductor de video del navegador servirá para la etapa de video.
- ⚠️ Los datos quedan en el navegador de cada dispositivo (ver ADR-003).
- ⚠️ Si se necesitara acceso profundo al sistema (por ejemplo, cámaras especiales), se
  podría empaquetar más adelante con Tauri o Electron sin reescribir la app.
