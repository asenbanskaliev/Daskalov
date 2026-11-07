# Tanda de nueve mejoras — ODD + TDD
Fecha: 7 noviembre 2026 · rama `feat/odd-tdd-web-mvp`.
SHA de funcionalidad: `8daeb52fb0c036081c87f38cebf9019ae16dced4`.

**Estado: 8 DONE, 1 PARTIAL.** La novena tarea S02.07 tiene pruebas de 100 fallos y retries locales, pero aún no tiempo máximo por fase. Nunca marcar FULL por el simple hecho de haber pasado mocks.

| Tarea | Estado |
|---|---|
| S00.06 | DONE |
| S01.02 | DONE |
| S01.05 | DONE |
| S01.08 | DONE |
| S02.01 | DONE |
| S02.05 | DONE |
| S02.06 | DONE |
| S02.10 | DONE |
| S02.07 | PARTIAL |

## RED → GREEN
- RED de modularización: https://github.com/asenbanskaliev/Daskalov/actions/runs/42409501320 (fallo esperado al requerir nuevos módulos).
- GREEN módulos y web E2E: https://github.com/asenbanskaliev/Daskalov/actions/runs/42409757731 y https://github.com/asenbanskaliev/Daskalov/actions/runs/42409757664.
- Green demo offline: https://github.com/asenbanskaliev/Daskalov/actions/runs/42410034241.
- Green fallback: https://github.com/asenbanskaliev/Daskalov/actions/runs/42410418231.
- Green ronda final CI/browser: https://github.com/asenbanskaliev/Daskalov/actions/runs/42410836748 y https://github.com/asenbanskaliev/Daskalov/actions/runs/42410836750.

## Pendientes exteriores y próximos pasos
1. Owner: proteger Environment y mover clave Cloud.
2. S02.07: conexión/idle y límites de tiempo por fase, pruebas 100 casos con caída de red y reconexión controlada.
3. S01.07: auditoría WCAG 2.2 AA incluyendo pruebas manuales.
4. S00.05/S10: autenticación y presupuesto distribuido antes de acceso abierto a Cloud.
5. S03/S04/S05: voces locales con español/acento búlgaro, STT y GLB animado.
