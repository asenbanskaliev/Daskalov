# Modelo de amenazas — Profesor Daskalov (STRIDE v1)

## Alcance y frontera de confianza
El juego usa un navegador HTML/Three.js, un backend Node.js y, opcionalmente, Ollama local o Cloud, whisper.cpp y Piper. Se consideran no confiables el texto del alumno, el audio recibido, los recuerdos guardados, las respuestas de modelos y las variables aportadas por el cliente. El backend y la configuración de Github Actions pueden contener secretos. El modo demo Internet no debe exponer la API privada.

## Activos a proteger
Clave Cloud y cuotas, sesiones HttpOnly/CSRF, identificadores de usuario, recuerdos y progreso, voz del alumno, respuestas escolares, archivos de voz licenciados, integridad de GLB y dependencias, pruebas y logs CI.

## Amenazas por categoría
| ID | Categoría | Escenario | Control técnico existente | Riesgo residual y validación pendiente |
|---|---|---|---|---|
| TH-01 | Spoofing | Leer memoria con UUID de otra persona | cookie HttpOnly SameSite=Strict, sesión del servidor, CSRF y validación de propietario | Autenticación e identidad parental reales aún no disponibles |
| TH-02 | Tampering | Editar recuerdos ajenos o manipular progreso | SQL parametrizado, UPDATE con player_id, restricciones y tests de aislamiento | Auditoría independiente y pruebas de concurrencia de producción pendientes |
| TH-03 | Repudiation | Operaciones de memoria sin trazabilidad | auditoría minimizada de exportación/corrección, sin texto/PII y TTL | Política jurídica y pruebas de incidentes pendientes |
| TH-04 | Information disclosure | Enviar OLLAMA_API_KEY al cliente o a un PR editable | proxy backend, secretos no insertados en bundle, workflow real manual en main | Environment protegido con reviewers pendiente de configurar |
| TH-05 | Information disclosure | Recuerdos de un alumno en la respuesta de otro | filtro propietario SQL y embedding owner_id, tests multiusuario | Test de carga/backup y auditoría humana pendientes |
| TH-06 | Information disclosure | El audio se graba o transmite sin permiso | botón de micrófono, solo temporal, Whisper loopback o navegador; sin audio en SQLite | Web Speech puede invocar servicios externos del navegador; permiso informado esencial |
| TH-07 | Tampering / XSS | HTML/JS generado por la IA ejecutado en navegador | textContent para contenido no confiable, CSP, script-src self, frame-ancestors none | Auditoría completa DOM y revisión externa pendientes |
| TH-08 | SSRF | El navegador elige endpoints internos o externos | URLs/modelos servidor validados, embeddings/Whisper limitados a loopback | Hardening red/egress y proxies externos no verificado |
| TH-09 | Elevation | Prompt injection en memorias falsifica rol system | separación declarativa de datos, allowlist eventos, límites, redacción de PII | El prompt no es una barrera de seguridad formal; requiere 50 pruebas con LLM real y revisión |
| TH-10 | Denial of service | Consumo de tokens y llamadas concurrentes hasta agotar Cloud | cuotas por IP/día/proceso, límite concurrency, timeout, abort, max chars | Falta autenticación y contador distribuido de coste/tokens reales para hosting público |
| TH-11 | Supply-chain | Dependencia o GitHub Action maliciosa | SHA-pinning, lockfile, npm audit CI, inventario SBOM y hash assets | Evaluación de licencias de voz/modelos y revisión de terceros pendientes |
| TH-12 | Safety of minors | Humor violento, respuesta peligrosa o revelación de datos | prompt seguro, fallback determinista sensible, 300 casos sintéticos | NO hay revisión docente, legal ni parental; bloqueo total de despliegue a menores |
| TH-13 | Data retention | Borrado parcial deja memoria en backups | borrado de SQLite incl. vectores FKs, TTL y redacción | Backups externos y rotación/supresión contractual por resolver |
| TH-14 | Untrusted release | CI verde se interpreta como permiso de publicar | gate FULL con SHA exacto, 109 tareas y firma externa Ed25519 | Seguridad de clave pública/reviewer y aprobación propietaria son externas al PR |

## Pruebas y procedimientos
- tests/security-session.test.mjs, tests/memory-http-rights.test.mjs, tests/embedding-api.test.mjs, tests/security-headers.test.mjs, tests/cloud-budget.test.mjs.
- tests/full-release-gate.test.mjs, tests/workflow-policy.test.mjs, tests/secret-rotation.test.mjs, tests/persona-300.test.mjs.
- Revisar cambios de amenazas en cada PR que toque endpoints, secretos, voz, sesiones, memoria, un proveedor externo o despliegue.
- Evidencias de CI unitario no prueban penetración ni protección real de menores. Requiere un revisor externo y resultados por SHA exacto.

## Decisión de no-go
Actualmente NO APTO para publicar con IA y menores: faltan login, cuotas distribuidas, consentimiento parental verificable, borrado de backups, auditoría externa, voz con licencia y validación pedagógica. Docker se limita a demo guionizada sin IA ni memoria.

