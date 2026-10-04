# 08 — Guía de desarrollo

Pensada para alguien que está empezando a programar.

## Requisitos

- **Node.js** 20 o superior (incluye `npm`). Comprobar con `node --version`.
- **Git** (para guardar el historial de cambios). Comprobar con `git --version`.
- Un editor: recomendado **Visual Studio Code**.

## Primeros pasos

```bash
npm install
```
Descarga las librerías del proyecto a la carpeta `node_modules/` (solo la primera vez, o
cuando cambie `package.json`).

```bash
npm run dev
```
Abre el servidor de desarrollo en <http://localhost:5173>. Cada vez que guardas un
archivo, el navegador se actualiza solo. Para detenerlo: `Ctrl + C` en la terminal.

## Probar en el celular o la tablet

Con `npm run dev -- --host`, Vite muestra una dirección del tipo
`http://192.168.x.x:5173`. Ábrela desde un dispositivo en la **misma red wifi**.

## Pruebas automáticas

```bash
npm test
```

Ejecuta los archivos `*.test.ts`. Cada prueba describe una regla
("termina el set a 25 con 2 de diferencia") y comprueba que el código la cumpla.
**Si cambias algo en `src/domain/`, ejecuta las pruebas.** Si una falla, o rompiste algo
o la regla cambió (y entonces hay que actualizar la prueba y la documentación).

Mientras programas, `npm run test:watch` las vuelve a ejecutar cada vez que guardas.

## Revisar tipos y compilar

```bash
npm run typecheck
```
TypeScript revisa que todo encaje (por ejemplo, que no uses un campo que no existe).

```bash
npm run build
```
Revisa los tipos y genera la versión final en `dist/`. Esa carpeta es la que se sube a un
hosting para publicar la app.

## Cómo hacer un cambio (receta)

1. **Entender** dónde va: ¿es una regla (domain), guardado (storage) o pantalla (ui)?
   Ver [02 — Arquitectura](02-arquitectura.md).
2. **Si es una regla**: primero escribe la prueba en el `*.test.ts` correspondiente,
   después el código, hasta que `npm test` pase.
3. **Si es interfaz**: cambia el componente y revísalo en el navegador con `npm run dev`.
4. **Actualiza la documentación** si cambian reglas, códigos o fórmulas.
5. Anota el cambio en [`CHANGELOG.md`](../CHANGELOG.md) bajo "Sin publicar".
6. `npm test` y `npm run build` deben terminar sin errores.
7. Guarda el cambio en Git (ver abajo).

## Git en dos minutos

Git guarda "fotos" (commits) del proyecto para poder volver atrás.

```bash
git status
```
Muestra qué archivos cambiaron.

```bash
git add -A
```
Prepara todos los cambios para la foto.

```bash
git commit -m "Agrega estadística de side-out"
```
Toma la foto con un mensaje que describe el cambio.

## Convenciones

- Código (variables, funciones) en **inglés**; comentarios, textos de la interfaz y
  documentación en **español**.
- Un componente React por archivo, con el mismo nombre (`Scoreboard.tsx` → `Scoreboard`).
- `domain/` no importa nada de `ui/` ni de `storage/`.
- No guardar valores que se pueden calcular (marcador, estadísticas).
- Decisiones técnicas importantes → nuevo documento en [`adr/`](adr/README.md).

## Glosario

| Término | Significado |
|---|---|
| **Componente** | Pieza de interfaz de React (un botón, el marcador, una pantalla) |
| **Estado** | Datos que, al cambiar, hacen que React vuelva a dibujar |
| **Hook** | Función de React que empieza con `use` (`useState`, `useMatch`) |
| **Dominio** | La lógica del problema real (el vóley), separada de la interfaz |
| **Evento** | Algo que pasó en el partido (una acción o un punto) |
| **PWA** | *Progressive Web App*: web que se instala y funciona sin conexión |
| **localStorage** | Pequeño almacén de datos dentro del navegador |
| **Build** | Versión optimizada de la app lista para publicar |
| **ADR** | *Architecture Decision Record*: documento que explica una decisión técnica |
