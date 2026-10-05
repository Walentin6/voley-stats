# VoleyStats

Aplicación de **scouting y estadísticas de vóley en vivo**, inspirada en Data Volley.
Funciona en el navegador (computadora, tablet o celular), **sin internet**, y guarda
cada acción en el momento.

> Estado: **v0.3.0 — rotaciones**. Ver [CHANGELOG](CHANGELOG.md) y la
> [hoja de ruta](docs/09-hoja-de-ruta.md).

## Qué hace hoy

- Crear equipos con su plantilla (número, nombre, posición).
- Crear partidos (al mejor de 3 o 5, puntos por set configurables).
- Registrar acciones en vivo de dos formas:
  - **Botones**: jugador → fundamento → resultado.
  - **Códigos de teclado** al estilo Data Volley: `7A#`, `a12R+`, `ap`, `T`, `c7:12`...
- Los 7 fundamentos de Data Volley: saque, recepción, armado, ataque, bloqueo, defensa y free ball.
- Marcador, sets, saque y final del partido calculados automáticamente (con elección del
  saque en el set decisivo).
- Formación por set y **rotación automática**: la cancha dibujada en los botones, sacador
  automático (`S+`) y estadísticas por rotación (P1–P6).
- Tiempos muertos y cambios, con contador por set.
- Avisos de posibles errores de carga.
- Deshacer la última acción (Ctrl+Z), o editar o borrar cualquiera del historial.
- Estadísticas por jugador y por equipo, de todo el partido o por set, con side-out y break-point.
- Exportar e importar partidos en JSON como respaldo.

## Empezar rápido

Requisitos: [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:5173> en el navegador. Más detalles en la
[guía de desarrollo](docs/08-guia-de-desarrollo.md).

## Comandos

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Abre la app en modo desarrollo (se recarga sola al cambiar el código) |
| `npm test` | Ejecuta las pruebas automáticas |
| `npm run typecheck` | Revisa errores de tipos (TypeScript) |
| `npm run build` | Genera la versión final en `dist/` |
| `npm run preview` | Sirve la versión de `dist/` para probarla |

## Estructura

```
├── docs/                 Documentación (empieza por docs/README.md)
├── public/               Archivos estáticos (ícono)
├── src/
│   ├── domain/           Lógica del vóley: tipos, reglas, marcador, estadísticas (+ pruebas)
│   ├── storage/          Guardado local y exportación
│   ├── ui/               Interfaz (pantallas y componentes React)
│   ├── App.tsx           Navegación entre pantallas
│   ├── main.tsx          Punto de entrada
│   └── styles.css        Estilos
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Documentación

Todo está en [`docs/`](docs/README.md): visión, arquitectura, modelo de datos, reglas,
códigos, fórmulas de estadísticas, guía de uso, guía de desarrollo, hoja de ruta y
registro de decisiones.
