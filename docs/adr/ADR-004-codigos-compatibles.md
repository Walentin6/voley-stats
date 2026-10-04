# ADR-004 — Códigos compatibles con Data Volley

- Estado: Aceptada
- Fecha: 2026-10-03

## Contexto
Los estadísticos profesionales usan Data Volley y cargan con códigos de teclado muy
rápidos. Para un producto general también queremos atraer a usuarios sin experiencia.

## Decisión
1. Ofrecer **dos formas de carga** que generan el mismo evento: botones táctiles y códigos.
2. Usar las **mismas letras y símbolos** que Data Volley para equipo (`*`/`a`),
   fundamentos (`S R E A B D`) y calidades (`# + ! - / =`).
3. Empezar por la parte esencial del código (`[equipo]número fundamento calidad`) y
   agregar las demás partes (tipo de golpe, zonas, combinaciones) como **opcionales al
   final**, para que los códigos simples sigan siendo válidos.
4. Detectar los pares "espejo" (ej. `S#` + `R=`) para que registrar ambos lados de un
   punto no lo cuente dos veces.

## Alternativas consideradas
- **Solo botones**: lento para expertos.
- **Un código propio**: obligaría a los estadísticos a reaprender.

## Consecuencias
- ✅ Curva de entrada suave (botones) y techo alto (códigos).
- ✅ Prepara el terreno para importar/exportar `.dvw`.
- ⚠️ La regla de espejos tiene un caso ambiguo poco probable: si se omite el saque y se
  registra `R=` del rival justo después de un ace en el rally anterior, se tomaría como
  el mismo punto. Documentado en [04 — Reglas de juego](../04-reglas-de-juego.md).
