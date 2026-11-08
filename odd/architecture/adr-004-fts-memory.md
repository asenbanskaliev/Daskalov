# ADR-004 — Memoria mínima FTS5 con relevancia, antigüedad y deduplicación

Estado: implementado como recuperación SQL/FTS5 local, con consentimiento privado. No se usa embeddings sin autorización, ni se ejecuta Cloud automáticamente.

La búsqueda limita por player_id y excluye recuerdos de más de 30 días; recupera candidatos FTS5 y recientes, deduplica por rol+contenido y ordena por coincidencias de palabras, preferencias explícitas y frescura. La consulta FTS usa los términos escapados y no admite instrucciones SQL.

Las inserciones idénticas durante las 24 horas siguientes se omiten para el mismo propietario y rol. Sigue vigente un límite de 200 filas por jugador, 1500 caracteres por recuerdo y límites de sesión. El lore ficticio está en una tabla separada y no se mezcla con los recuerdos del alumno.

Los recuerdos se suministran al ContextBuilder identificados como datos NO confiables. El algoritmo heurístico no es búsqueda semántica por vectores y no equivale a Engram FULL: S07.06 (embeddings y búsqueda híbrida) queda pendiente.

Tests: tests/memory-ranking.test.mjs, tests/migrations-rights.test.mjs, tests/privacy-retention.test.mjs y tests/context-builder.test.mjs.

## Extensión v3: recuperación híbrida solo con Ollama local
- SQLite v3 registra el modelo, vector Float32, owner y checksum de cada recuerdo; las eliminaciones se propagan con claves foráneas.
- POST /api/memory/reindex requiere sesión privada, CSRF y un límite de 10 recuerdos. El reindexado nunca contacta Cloud.
- El chat solo genera un vector de consulta cuando DASKALOV_ENABLE_LOCAL_EMBEDDINGS=1 y DASKALOV_EMBED_MODEL está configurado. Ante cualquier error vuelve a FTS5.
- Los recuerdos corregidos invalidan automáticamente el checksum anterior hasta reindexar.
- Documentación oficial de Ollama: https://docs.ollama.com/api, endpoint POST /api/embed.
- El proveedor real no se ha probado: solo está validado el contrato con mocks. La revisión legal de memoria de menores permanece bloqueada.
