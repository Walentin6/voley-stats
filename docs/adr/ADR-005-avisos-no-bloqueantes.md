# ADR-005 — Los avisos de carga no bloquean

- Estado: Aceptada
- Fecha: 2026-10-04

## Contexto
En la versión 0.2 la app empieza a detectar posibles errores de carga: un saque del equipo
que no saca, una recepción del equipo que saca, un rally que no terminó, demasiados tiempos
muertos o cambios.

Hay dos formas de tratarlos: **impedir** registrar la acción, o **registrarla y avisar**.

## Decisión
Registrar siempre y **avisar** con ⚠, en la vista previa del campo de códigos y en el
historial.

## Alternativas consideradas
- **Bloquear**: evita errores, pero en vivo es peligroso. Si el estadístico se equivocó
  antes (por ejemplo, se le pasó un punto), la app "cree" que saca el equipo equivocado y
  no lo dejaría cargar lo que de verdad está pasando. Además, algunas competiciones tienen
  otros límites de tiempos y cambios.

## Consecuencias
- ✅ La carga nunca se traba en medio de un partido.
- ✅ El estadístico ve el aviso y corrige cuando puede (deshacer, borrar, cambiar saque).
- ⚠️ Puede quedar algún dato mal si se ignoran los avisos.
- Los avisos se calculan al reproducir los eventos (`computeMatchState`), así que al corregir
  un error anterior, los avisos posteriores desaparecen solos.
