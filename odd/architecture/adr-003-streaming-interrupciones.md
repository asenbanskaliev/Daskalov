# ADR-003 — Conversación progresiva y cancelación de Daskalov
**Estado:** implementado parcialmente en prototipo y verificado con mocks. **Fecha:** 2026-11-07.

## Contratos
- Cliente `src/conversation.js` hace POST /api/chat/stream y lee `application/x-ndjson`.
- Cada evento tiene `type`, `requestId` del servidor y `sequence` creciente. Tipos actuales: `started`, `delta`, `sentence`, `completed`, `error`.
- El servidor `server/main.mjs` arma el contexto, aplica cuotas, valida sesión si memoria autorizada, inicia `server/ollama.mjs:streamOllama` y traduce NDJSON de Ollama.
- `SentenceChunker` extrae frases para voz sin esperar al final, máximo por fragmento 160 caracteres por defecto.
- UI muestra progresivamente los deltas, pone en cola frases Web Speech y permite `Interrumpir` con AbortController.
- Si se desconecta el cliente, el servidor aborta upstream y **no escribe** conversación parcial en SQLite.
- Los mensajes del proveedor se convierten en texto plano, no HTML. El contenido `thinking` no se envía al cliente.

## Seguridad y prestaciones
- `OLLAMA_API_KEY` está solo en backend; Ollama local utiliza URL fija del administrador, no URL desde navegador.
- NO existe fallback silencioso de local a Cloud.
- No se permiten dos solicitudes simultáneas por IP en modo privado; cuotas por minuto/día. Esta limitación todavía no es suficiente para despliegue público.
- Longitud de respuesta y NDJSON acotadas para evitar OOM.
- El motor TTS actual usa voces disponibles en el navegador y **no garantiza acento búlgaro** ni sincronización labial exacta.

## Pruebas de aceptación
- Unit: tests/stream.test.mjs, tests/conversation-client.test.mjs.
- Integration: tests/server-stream.test.mjs, tests/security-session.test.mjs.
- Browser: e2e/classroom.spec.js (Chromium + Firefox).
- Evidencia a SHA `35e095bc`: fast https://github.com/asenbanskaliev/Daskalov/actions/runs/42407451468; browser https://github.com/asenbanskaliev/Daskalov/actions/runs/42407451385.

## Próximas decisiones
- Versionar esquemas de evento (v2), timeouts por fase y backpressure.
- Añadir eventos de gestos/visemas con timeline de audio.
- Llevar pruebas Ollama streaming real a GitHub Environment con aprobación en main, sin secrets en PR de rama.
- Integrar STT local y TTS multilingüe elegido por benchmark de licencia, latencia y pronunciación.
