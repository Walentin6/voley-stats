# ADR-006 — Rotaciones opcionales y líbero sin seguimiento

- Estado: Aceptada
- Fecha: 2026-10-04

## Contexto
La v0.3 agrega rotaciones: saber quién está en cada posición para sacar automáticamente,
mostrar la cancha y calcular estadísticas por rotación. Hay que decidir:
1. Si la formación es **obligatoria** al empezar cada set.
2. Cómo tratar al **líbero**, que entra y sale constantemente reemplazando a jugadores de atrás.

## Decisión
1. La formación es **opcional**. Se propone al empezar cada set (con la del set anterior ya
   puesta), pero se puede omitir. Sin formación, la app funciona igual que en la v0.2.
2. Las entradas y salidas del líbero **no se registran**. El líbero no va en la formación;
   sus acciones se cargan con su número y no generan el aviso "no está en cancha".
3. La formación es un **evento** más (`lineup`), igual que las acciones. La rotación se
   calcula al reproducir los eventos: cada side-out rota al equipo que recupera el saque.

## Alternativas consideradas
- **Formación obligatoria**: datos más completos, pero frena a quien solo quiere anotar
  puntos o empieza a cargar un partido ya comenzado.
- **Seguir al líbero** (registrar cada entrada/salida): es lo que hace Data Volley, pero en
  vivo son 2 registros extra por rally en muchos rallies. Para las estadísticas por rotación
  no hace falta, porque la rotación se define por la posición de los 6 titulares y el líbero
  nunca saca.

## Consecuencias
- ✅ Carga en vivo igual de rápida que antes; la formación suma pocos segundos por set.
- ✅ Las estadísticas por rotación, el sacador automático y la cancha funcionan sin
  registrar al líbero.
- ✅ Corregir la formación (o un cambio) recalcula todas las rotaciones posteriores.
- ⚠️ La app no sabe a quién reemplaza el líbero en cada momento. Si en el futuro se quieren
  estadísticas de "quién estaba en cancha" en cada punto (por ejemplo, +/− por jugador),
  habrá que registrar las entradas del líbero.
