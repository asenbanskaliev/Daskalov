# Output moderation and stream safety

The backend buffers each individual sentence before sending its first text delta or TTS sentence event. A disallowed sentence receives a safe generic fallback; raw harmful text and obvious identifiers are not sent to the browser, speech engine, or persisted to player memory.

This is a deterministic screening layer and may miss harmful subtleties or introduce false positives. It does NOT certify child safety, accuracy, legality or privacy compliance; human adversarial review, moderation expertise and guardian consent remain external blockers.

Streaming occurs at sentence granularity rather than every model token, preserving interactivity while avoiding exposure of unreviewed token fragments.

Tests: tests/output-moderation.test.mjs, tests/server-stream.test.mjs and existing network cancellation cases.

La lista conservadora incorpora coerción de menores para ocultar información a tutores, peticiones de DNI/contraseñas, consejos peligrosos explícitos y amenazas/acoso del docente. Se prueban tanto bloqueos como frases escolares válidas. Sigue siendo un filtro léxico que puede omitir paráfrasis, idiomas y ataques complejos; no es un clasificador infantil integral.
