# Evidencias ODD por fases — Daskalov
Fecha de corte: 2026-11-07.

| Gate | Estado actual | Evidencia |
|---|---|---|
| SEC-READY | PARTIAL: cookies/CSRF/política Actions PASS; environment y menores pendientes | CI https://github.com/asenbanskaliev/Daskalov/actions/runs/42405520911 |
| WEB-READY | PARTIAL: build Vite + browser Chrome/Firefox PASS; WCAG/modularización/offline pendientes | CI https://github.com/asenbanskaliev/Daskalov/actions/runs/42407451385 |
| CONV-READY | PARTIAL: Ollama streaming/NDJSON/cancel/sentences mocks PASS; Cloud streaming REAL/Local REAL pendiente | CI https://github.com/asenbanskaliev/Daskalov/actions/runs/42407451468 |
| STT-READY | TODO: Web Speech existe, falta STT local y evaluación | — |
| VOICE-READY | TODO: Web Speech existe, falta voz búlgaro-español real | — |
| 3D-READY | TODO: aula procedural, falta GLB rigged/performance | — |
| AV-READY | TODO: boca aproximada, no lipsync profesional | — |
| MEM-READY | PARTIAL: SQLite FTS5+autorización privada/CSRF; legislación/exportación etc. pendientes | CI https://github.com/asenbanskaliev/Daskalov/actions/runs/42405520911 |
| PERSONA-READY | TODO: prompt existe; sin eval de 100 escenarios | — |
| GAME-READY | TODO: sólo interfaz de conversación | — |
| SEC-PUBLIC | BLOQUEADO: menores/Cloud público sin autorización robusta | — |
| PERF-READY | TODO: FPS/latencias no medidos | — |
| FULL | NO ALCANZADO | — |

Las pruebas unitarias con Ollama simulado no demuestran Cloud ni Ollama local real. El último smoke real de Beam anterior al cambio de seguridad permanece en https://github.com/asenbanskaliev/Daskalov/actions/runs/42403138240 y solo acredita aquel SHA anterior. El nuevo workflow Cloud no se ejecutará automáticamente hasta publicarse código revisado en main y configurar Environment protegido.

## Actualización — SHA 8daeb52f (2026-11-07)
- CI unit/build: https://github.com/asenbanskaliev/Daskalov/actions/runs/42410836748 SUCCESS.
- Browser E2E Chromium/Firefox: https://github.com/asenbanskaliev/Daskalov/actions/runs/42410836750 SUCCESS.
- Ocho nuevas tareas DONE: S00.06, S01.02, S01.05, S01.08, S02.01, S02.05, S02.06, S02.10.
- S02.07 PARTIAL. S00.05, S00.07 y S01.07 siguen PARTIAL por controles y revisiones no realizados.
- S00.01 BLOCKED_EXTERNAL, sin cambios en main; **seguridad para menores y exposición pública todavía NO APTA**.
- Estimación de tokens y coste ≠ métrica de facturación de Ollama.

## Cierre final de tanda — SHA f9ab9dd9 (2026-11-07)
- S02.07 pasa de PARTIAL a DONE tras conexión/idle/total timeouts, parser NDJSON cancelable y batería 100 escenarios de fallos.
- Unit https://github.com/asenbanskaliev/Daskalov/actions/runs/42411299316 SUCCESS.
- Browser https://github.com/asenbanskaliev/Daskalov/actions/runs/42411299248 SUCCESS.
- Tanda 9/9 DONE. Total plan 19/109 DONE. S00.01, S00.05, S00.07, S01.07 y publicación pública siguen bloqueadas/pendientes y fuera de las nueve de la tanda.

## Avances verificados 8 noviembre 2026 — 52/109
- 33 contratos nuevos validados por unitarios/build de 55ff7dff7; gates externos no cumplidos.
- CI unitarios/build: https://github.com/asenbanskaliev/Daskalov/actions/runs/42462595231 SUCCESS.
- Auditoría de seguridad: https://github.com/asenbanskaliev/Daskalov/actions/runs/42462595023 SUCCESS.
- Rendimiento sintético (100 conversaciones y 10 sesiones): https://github.com/asenbanskaliev/Daskalov/actions/runs/42461893207 SUCCESS.
- Último navegador del GLB: https://github.com/asenbanskaliev/Daskalov/actions/runs/42462595065 PENDIENTE, no declarar aprobado.
- Control release: npm run gate:status informa, npm run gate:full falla salvo 109/109 y evidencia firmada externa.

## Corte 2026-11-08 — 64/109 contratos técnicos verificados
- Se reconcilian 12 cierres de la tanda Engram, GLB AnimationMixer, eventos, riesgos, stress y documentación.
- CI rápido/build: https://github.com/asenbanskaliev/Daskalov/actions/runs/42464685879 SUCCESS.
- Seguridad: https://github.com/asenbanskaliev/Daskalov/actions/runs/42464685878 SUCCESS.
- Rendimiento sintético: https://github.com/asenbanskaliev/Daskalov/actions/runs/42464685880 SUCCESS.
- Chromium/Firefox: https://github.com/asenbanskaliev/Daskalov/actions/runs/42464485893 SUCCESS, SHA anterior para UI estable.
- S07.06 completado como **funcionalidad opcional mock-verificada**; prueba proveedor real sigue S02.09. S08.06 mantiene PARTIAL por falta de LLM/humano reales.
- Quedan 45 tareas; FULL, SEC-PUBLIC y VOICE-READY no están aprobados.

## Reconcilación 8 noviembre 2026 — 74/109
- Los 10 IDs de la sección 4G alcanzaron los contratos técnicos, con pruebas automatizadas y CI rápido verde.
- https://github.com/asenbanskaliev/Daskalov/actions/runs/42467411741 unit/build SUCCESS.
- https://github.com/asenbanskaliev/Daskalov/actions/runs/42467411676 seguridad SUCCESS.
- https://github.com/asenbanskaliev/Daskalov/actions/runs/42467411860 navegador PENDIENTE EN ESTE CORTE.
- Los gates externos de menores, rendimiento real, Cloud y voz autorizada no están certificados. FULL=NO.

## Browser GLB real (sin IA ni voz reales) — 8 noviembre 2026
- Run https://github.com/asenbanskaliev/Daskalov/actions/runs/42467630215 **SUCCESS**, SHA 93c5d0284.
- Chromium y Firefox validan que el personaje GLB no solo existe en HTTP sino que se carga en la escena si WebGL está disponible; fallback texto cuando no.
- No cubre hardware móvil real, GPU Iris Xe, calidad de voz licenciada ni auditoría humana. Los gates FULL/3D-READY continúan bloqueados.
