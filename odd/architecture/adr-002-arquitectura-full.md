# ADR-002 — Arquitectura objetivo integrada para Daskalov FULL
**Estado:** propuesta para implementación, 2026-11-07. **No sustituye ADR-001 hasta gates y revisión.**

## Decisión principal
Cliente **HTML + TypeScript/JavaScript modular + Three.js empaquetado con Vite** y backend **Node.js 24**. No React obligatorio, no Electron/Godot, ni app nativa. El jugador abre una URL HTTPS. El backend protege credenciales, autoriza identidad, gestiona Ollama, memoria y proveedores TTS/STT locales o remotos. SQLite+FTS5 es el almacén principal; embeddings Ollama son opt-in y caché auxiliar.

## Diagrama de componentes
~~~
Navegador  ─> UI (estado de sesión y permisos)
           ├> Aula Three.js GLB / AnimationMixer / morph targets
           ├> Captura micro / teclado / VAD + subtítulos
           └> Cliente SSE o fetch-stream ──> Node conversation orchestrator
                                          ├> Authn/Authz + consent + cuota
                                          ├> ContextBuilder(persona, clase, lore, memoria)
                                          ├> OllamaAdapter(cloud | local)
                                          ├> SentenceChunker → TTSRouter(browser | local | cloud)
                                          ├> SQLite+FTS5 (+ embeddings opt-in)
                                          └> métricas agregadas, sin contenido privado
                                 audio/visemas ──> Web Audio scheduler + avatar
~~~

## Contrato de conversación (versión objetivo v2)
Solicitud: POST /api/v2/conversations/{sessionId}/turns
~~~
{
 "requestId": "uuid-v4",
 "input": { "kind": "text", "text": "Profesor..." },
 "provider": { "kind": "cloud|local", "model": "model-tag", "allowFallbackToCloud": false },
 "contextEvent": { "type": "turn_around|question|interruption", "timestamp": 1234 },
 "voice": { "provider": "browser|local|cloud", "voiceId": "approved-voice" }
}
~~~
Identidad y permiso: sesión validada en backend + cookie segura HttpOnly para despliegue HTTPS; no aceptar playerId arbitrario como autoridad. La memoria solo se usa con autorización válida, nunca por la existencia de un UUID.

Respuesta progresiva SSE o NDJSON con eventos de esquema cerrado:
- turn.started {requestId, turnId}
- text.delta {requestId, sequence, text}
- text.sentence {requestId, sequence, text}
- animation.cue {requestId, cueId, allowedGesture, startOffsetMs}
- audio.chunk {requestId, sequence, format, durationMs, audioRef} / o canal dedicado binario
- viseme.cue {requestId, sequence, kind, audioOffsetMs, durationMs}
- turn.completed {requestId, provider, timings, usage}
- turn.cancelled / turn.error {requestId, code, retryable}.

Los eventos se validan, llevan monotonía de secuencias, deduplicación y nunca se renderizan como HTML ejecutable. **No confiar en expresiones gestuales arbitrarias generadas por el LLM**: un parser/selector las normaliza contra una whitelist. Cancelación: AbortController + endpoint DELETE de turno; solo el último requestId activo puede escribir memoria y reproducir audio.

## Estrategia Ollama
- Cloud desde servidor únicamente con OLLAMA_API_KEY; local desde URL previamente configurada por administrador (no URL libre del cliente → evitar SSRF).
- Modelos por proveedor con disponibilidad real; no asumir que tags hardcodeados están activos.
- Streaming NDJSON, presupuesto por tokens y síntesis progresiva por frases; detener en desconexión.
- Fallos vacíos/razonamiento de Beam: ver regresión real histórica y test específico (F2). Beam es opción avanzada, no promesa de latencia conversacional.
- Nunca fallback de local→Cloud sin opt-in explícito por sesión.

## Estrategia de voz
- Entrada: SpeechRecognition disponible + teclado universal; backend STT local opcional, Cloud STT opcional solo con información y consentimiento.
- Salida: Web Speech TTS = fallback gratuito; TTS local Piper/Kokoro según benchmark real; Cloud TTS configurable.
- Selección final de voz Daskalov con interpretación consentida del actor adulto que domine español con acento búlgaro natural. Licencias de clonación y voces verificadas; jamás presentar pitch como acento.
- Web Audio Buffer scheduling y backpressure de chunks; requestID permite cancelación y descarta respuestas tardías.
- Morph targets REST/A-I/E/O/U/MBP/FV/L/CHSH/blink, viseme timeline desde TTS si disponible; fallback aproximado marcado.

## Memoria SQL: esquema conceptual
Tablas: players, sessions, consents, memories, memories_fts, memory_embeddings, learning_progress, daskalov_lore, events_audit_minimal.
- claves ajenas, índices por propietario, migraciones con schema_version y backups;
- memory.kind = preference|learning|conversation; lore en dominio separado sin datos del alumno;
- guardado solo con base legal, consentimiento opt-in verificable cuando corresponda;
- retención: chat temporal efímero; recuerdos por defecto hasta 90 días con rotación y opción de extensión explícita; borrar/exportar todo;
- búsqueda: FTS5 + recency + importance; embeddings solo tras pruebas A/B y con coste/privacidad documentados.

## Seguridad
- Un identificador UUID en localStorage **NO es autenticación** para endpoints de recuerdos.
- HTTPS, CSP, Permissions-Policy, CORS de mismo origen, CSRF, rate limits por cuenta/IP, cuota por modelo y circuit breakers, no HTML dinámico inseguro, no logs de conversaciones de menores.
- Antes de producto público dirigido a menores en España, revisar RGPD y LOPDGDD art.7: si la base jurídica es consentimiento y el menor tiene menos de 14 años, exigir autorización de su representante legal. Debe haber revisión jurídica específica, sin usar un simple checkbox infantil como autorización.
- Requerir una modalidad de prueba sin cuenta que no persista identidad ni conversación y cuyo acceso Cloud tenga límites efectivos.

## Rendimiento y calidad
- Gráficos: cargar GLB bajo demanda, texturas comprimidas, LOD, calidad automática, objetivo 55-60 FPS PC y al menos 30 FPS hardware modesto; medir en pruebas reales.
- Conversación: métricas p50 y p95 separadas por modelo; TTFB, primer audio, RTF, gaps, carga de CPU/GPU. Beam y modelo rápido medidos aparte.
- Accesibilidad WCAG 2.2 AA en interfaz: subtítulos, reducción de movimiento, opción teclado, apagado micrófono y controles de sonido.

## ADRs derivados a escribir en implementación
ADR-003 streaming SSE/NDJSON y endpoint cancellation.
ADR-004 selección final TTS/STT con matriz de licencias.
ADR-005 voz propia y derechos.
ADR-006 política de memoria, identidad/consentimiento y retención.
ADR-007 selección modelo rápido vs Beam.
ADR-008 hosting HTTPS y límites de coste.
