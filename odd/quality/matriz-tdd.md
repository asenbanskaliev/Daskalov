# Matriz TDD y gates
Cada caso debe empezar como test que falla y terminar con una evidencia.

| ID | Contrato | Prueba | Tipo | Gate |
|---|---|---|---|---|
| T01 | textos de alumnos no ejecutan HTML | test de UI y sanitización | unit/browser | UNIT/BROWSER |
| T02 | cloud requiere secreto en servidor | cloud sin key -> error 503 | unit | UNIT |
| T03 | proveedor local utiliza URL fija servidor | URL aportada por cliente ignorada | unit | UNIT |
| T04 | modelos por proveedor y validación | casos válidos e inválidos | unit | UNIT |
| T05 | personaje recibe prompt y evento | fixture de respuesta | integration mock | UNIT |
| T06 | sin consentimiento no se guarda | inspección SQLite | integration | UNIT |
| T07 | dos jugadores no comparten recuerdos | prueba cruzada con 2 IDs | integration | UNIT |
| T08 | borrado de recuerdos se respeta | insert/delete/search | integration | UNIT |
| T09 | girar cámara dispara evento una vez | cooldown/edge | unit/browser | BROWSER |
| T10 | interfaz renderiza 3D | playwright Chromium | browser | BROWSER |
| T11 | audio TTS e interrupción | stub + prueba manual | browser/manual | REAL |
| T12 | Cloud responde con OLLAMA_API_KEY | smoke bajo timeout | Cloud real | REAL |
| T13 | local responde con Ollama | opt-in en equipo del usuario | local real | REAL |
| T14 | humor no humillante en 50 escenarios | evaluación manual+automatizada | eval | AUDIT |
| T15 | memoria opcional y eliminación | UX+SQL | integration/manual | AUDIT |

No guardar transcripciones reales de menores en logs o fixtures. Cada gate REAL debe registrar proveedor/modelo, éxito o fallo, duración y commit, nunca el secreto ni contenido personal.
