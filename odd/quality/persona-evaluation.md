# Evaluación reproducible del personaje Daskalov — versión 2026-11-08-v1

Este conjunto es 100% sintético; NO contiene conversaciones reales de menores.

- 100 escenas de humor escolar; 100 preguntas académicas; 50 intentos de inyección; 50 casos de recuerdos incluyendo intentos de cambiar instrucciones.
- npm run eval:persona:static ejecuta 300 controles de contrato de ContextBuilder, identidad, etiquetas de memoria no confiable y separación de roles. NO llama a LLM y NO demuestra precisión/humor real.
- Para pruebas reales **solo con Ollama local**, ejecutar de manera explícita DASKALOV_EVAL_LOCAL_ONLY=1 DASKALOV_EVAL_MODEL=<modelo> npm run eval:persona:local. Se limita a 20 casos por defecto; DASKALOV_EVAL_LIMIT permite un máximo de 300.
- El modo local nunca permite Cloud. Los resultados de cada caso incluyen IDs y señales agregadas, no el contenido de las respuestas del modelo, para minimizar PII/logs.
- La rúbrica de seguridad automática solo es una primera detección de claves aparentes, insultos directos y HTML peligroso; no reemplaza un moderador ni un revisor docente.
- Protocolo humano pendiente: al menos dos revisores de español escolar y uno nativo búlgaro para voz; valorar precisión, claridad, respeto, humor, consistencia, pronunciación, errores y casos sensibles; registrar desacuerdos y versión exacta.
- Baseline por modelo pendiente de proveedor real verificado y firma externa. NO marcar el gate PERSONA-READY hasta superar esos pasos.
