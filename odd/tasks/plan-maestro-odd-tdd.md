# Plan maestro ejecutable — Profesor Daskalov
Fecha: 2026-11-07. Objetivo: videojuego WEB (no app nativa), profesor 3D con humor educativo, conversación por voz, Ollama Cloud/local y memoria persistente SQLite estilo Engram.

## Regla de evidencias
Un checkbox solo puede estar marcado si existen código real, tests y gate correspondiente superado. Estado PARTIAL se documenta sin marcar la casilla. Cada entrega debe registrar commit, pruebas y limitaciones. No confundir test mock con prueba de Ollama real.

## F0 — Base web y CI (dependencia de todas)
- [x] F0-01 Servidor Node 24 sirve HTML/CSS/JS desde mismo origen, sin exponer secretos.
- [x] F0-02 Scripts test/check/build/start y documentación reproducible.
- [x] F0-03 GitHub Actions en push/PR: revisión sintáctica, tests, build y artefactos.
- [x] F0-04 Gate REAL independiente en Actions con el secreto OLLAMA_API_KEY, timeout, tokens mínimos y sin registrar respuesta ni credenciales.
GATE: CI verde en rama y smoke Cloud real confirmado por separado.

## F1 — Escenario y comportamiento
- [ ] F1-01 Escenario 3D Three.js: aula, pizarra, pupitres, profesor procedural/GLB y cámara.
- [ ] F1-02 Interacción: giro de cámara detectado y reacción del profesor con antispam.
- [ ] F1-03 Animaciones idle, gestos teatrales y movimiento de boca.
- [ ] F1-04 Fallback sin WebGL e interfaz accesible.
GATE: pruebas de eventos + smoke de Chromium + revisión visual con FPS medidos en hardware objetivo.

## F2 — IA configurable
- [ ] F2-01 Backend: Ollama Cloud (https://ollama.com/api/chat, modelo beam, Bearer env).
- [ ] F2-02 Backend: Ollama local (/api/chat); selección de modelo e inspección de modelos instalados.
- [ ] F2-03 UI selección Cloud/local, errores claros, prueba de conexión y configuración persistente no sensible.
- [ ] F2-04 Personalidad permanente, contexto de eventos, historial acotado y anti-inyección en contenido externo.
- [ ] F2-05 Pruebas de contrato mock + integración real Cloud + integración real local opcional.
GATE: mismo diálogo básico por ambos proveedores cuando disponibles; evidencias etiquetadas.

## F3 — Voz bidireccional
- [ ] F3-01 Micrófono con permisos y fallback de teclado: SpeechRecognition o STT de servidor.
- [ ] F3-02 TTS Web Speech inicial y selección de voz; salida por altavoces.
- [ ] F3-03 Estudio y prueba de voz española con acento búlgaro (no basta voz es-ES).
- [ ] F3-04 Cola de audio, interrupciones, cancelación, TTS streaming y sincronización de labios.
GATE: 20 diálogos reales (medir latencia de primer audio, total, errores y calidad de acento).

## F4 — Memoria tipo Engram sobre SQL
- [x] F4-01 SQLite + FTS5, historial y recuerdos separados por jugador, consultas parametrizadas.
- [ ] F4-02 Consentimiento explícito, memoria desactivada por defecto, borrar y consultar recuerdos.
- [ ] F4-03 Recuperación de recuerdos relevantes sin mezclas entre alumnos; deduplicación, TTL y límites.
- [ ] F4-04 Autobiografía ficticia coherente del profesor separada de los datos personales reales.
- [ ] F4-05 Embeddings locales opcionales para búsqueda semántica cuando FTS5 no baste.
GATE: tests de aislamiento, borrado, retención y referencias narrativas verificables.

## F5 — Jugabilidad y educación
- [ ] F5-01 Máquina de estados del profesor (idle, atento, sorprendido, indignación cómica, explicando).
- [ ] F5-02 Eventos: girarse, interrumpir, silencio, calefacción, deberes, tecnología y lecciones.
- [ ] F5-03 Misiones educativas cortas, preguntas, feedback y progreso opt-in.
- [ ] F5-04 Humor inocente: narra castigos históricos de forma exagerada, jamás los aplica ni los celebra.
GATE: matriz de 50 prompts sobre humor, memoria, seguridad infantil y precisión educativa.

## F6 — Rendimiento, seguridad y publicación
- [ ] F6-01 Presupuesto de triángulos/texturas, lazy load y perfiles gráfico 30/60 FPS.
- [ ] F6-02 Seguridad: rate-limit, origen, validación, respuesta de LLM no ejecutable, claves protegidas.
- [ ] F6-03 Revisión RGPD/menores, consentimiento parental si aplica, retención y política privacidad.
- [ ] F6-04 CI browser multi-OS razonable, auditoría de dependencias, pruebas E2E, accesibilidad.
- [ ] F6-05 Despliegue HTTPS web; modo demo sin credenciales y documentación.
GATE: checklist de lanzamiento + revisión manual de privacidad y costes.

## Orden de ejecución
F0 -> F1+F2 mocks -> F2 real -> F3 inicial -> F4 -> F5 -> F3 mejorado+F6. Agrupar cambios seguros en tandas para reducir ejecuciones del CI; nunca esperar un CI largo para preparar el siguiente bloque, pero no certificar tareas antes de su resultado.

## Estado tras primera tanda (2026-11-07)
- F0 DONE: CI con sintaxis, tests mock, build web y artefacto: https://github.com/asenbanskaliev/Daskalov/actions/runs/42402282091 (success, SHA 58e233a7).
- Cloud REAL: GitHub Actions consumió el secreto OLLAMA_API_KEY en una llamada real con el modelo beam: https://github.com/asenbanskaliev/Daskalov/actions/runs/42402282107 (success, SHA 58e233a7). No se registra el contenido ni la clave.
- F4-01 DONE (infraestructura): SQLite + FTS5, SQL parametrizado, separación player_id y test de lectura/aislamiento/borrado en CI. Falta revisar consentimiento y endurecer retención y semántica para fases siguientes.
- F1 PARTIAL: aula/profesor 3D procedural, gestos y detección de giro implementados; pendiente browser E2E y revisión visual de FPS.
- F2 PARTIAL: Cloud/local configurables, contrato de Ollama mock y conexión Cloud directa real probada; pendiente diálogo end-to-end en navegador y prueba real de Ollama local.
- F3 PARTIAL: Web Speech como STT y TTS de demostración; NO se ha validado la voz búlgara ni latencia de audio.
- F4 PARTIAL: memoria opt-in + borrado desde UI; pendiente autenticación/consentimiento parental, mejor deduplicación y política de retención validada.
- Nunca declarar FULL hasta superar también los gates BROWSER, REAL (diálogo + voz) y AUDIT.

## Evidencias iniciales
- Repo inicializado en main y rama feat/odd-tdd-web-mvp creada.
- OLLAMA_API_KEY declarado por el propietario como Repository secret; no comprobable ni visible desde el código. El workflow real ha verificado acceso correcto al secreto sin revelarlo (run 42402282107).
