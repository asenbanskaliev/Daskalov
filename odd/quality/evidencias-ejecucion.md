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
