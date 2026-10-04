# ADR-002 — El partido es una lista de eventos

- Estado: Aceptada
- Fecha: 2026-10-03

## Contexto
Durante un partido en vivo hay errores de carga constantemente: un número equivocado,
una calidad mal elegida, un punto que no correspondía. Corregir debe ser instantáneo y
no puede dejar el marcador inconsistente.

## Decisión
Un partido guarda **solo la lista ordenada de eventos** (acciones y puntos manuales).
Todo lo demás — marcador, sets, saque, ganador, estadísticas — se **calcula** recorriendo
esa lista (`computeMatchState`, `computeTeamStats`). Esta técnica se conoce como
*event sourcing*.

## Alternativas consideradas
- **Guardar el marcador y actualizarlo con cada acción**: más simple al principio, pero
  deshacer o borrar una acción del medio obliga a "restar" con cuidado, y es fácil que
  el marcador quede mal.

## Consecuencias
- ✅ Deshacer, borrar o (en el futuro) editar cualquier acción es trivial y siempre correcto.
- ✅ Imposible que marcador y estadísticas se desincronicen.
- ✅ Agregar una estadística nueva funciona también con partidos viejos.
- ✅ Cada evento tiene hora: base para sincronizar video.
- ⚠️ Se recalcula todo en cada cambio. Con ~1000 eventos tarda menos de 1 ms, así que no
  es un problema; si algún día lo fuera, se puede guardar un caché.
