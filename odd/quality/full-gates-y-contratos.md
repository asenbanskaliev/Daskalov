# FULL — Contratos TDD, gates, evidencias y seguridad CI
Fecha: 2026-11-07. Complemento ejecutable de odd/tasks/implementacion-full-odd-tdd.md.

## Ciclo TDD de una tarea
1. Crear test RED (unit o component para lógica, integration para servidor, E2E Playwright para usuario).
2. Registrar prueba FALLIDA con mensaje esperado; no alterar pruebas para acomodar un bug.
3. Codificar lo mínimo. Ejecutar pruebas dirigidas GREEN y luego regresión completa.
4. REFACTOR; lint/check, seguridad, revisiones, cobertura crítica.
5. Evidencia: [ID, SHA remoto, command, exit code, workflow run, artefactos, métrica y captura si aplica].
6. Marcar [x] únicamente tras gate + evidencia con SHA exacto. Fallo real/externo se registra BLOCKED_EXTERNAL, no DONE.

## Catálogo inicial de pruebas (todas deben desarrollarse)
| ID | RED / comportamiento obligatorio | Nivel / puerta |
|---|---|---|
| SEC-001 | Workflow que contiene acceso a secreto y trigger PR/feat push es rechazado | static policy / SEC-READY |
| SEC-002 | Token/checkout con write sin justificación no pasa revisión | static / SEC-READY |
| SEC-003 | PR de fork no obtiene secreto ni ejecuta fetch cloud | workflow/SEC-READY |
| SEC-004 | Solicitud de memories con UUID ajeno sin sesión autenticada => 401/403 | integration/SEC-READY |
| SEC-005 | 100 solicitudes anónimas no consumen 100 llamadas Cloud | integration/SEC-READY |
| SEC-006 | Memoria off => DB sin nuevos datos del alumno | SQLite/SEC-READY |
| WEB-001 | npm ci/build reproducible offline CI, dependencia Three local | build/WEB |
| WEB-002 | Lógica de UI, escena y red importable para mocks | unit/WEB |
| WEB-003 | GET / y reload sirven JS/CSS compilados | browser/WEB |
| WEB-004 | Chromium + Firefox: envío texto, respuesta mock, error, teclado | E2E/WEB |
| WEB-005 | Configuración accesible en móvil y teclado | E2E/WEB |
| WEB-006 | WebGL/STT/TTS ausente => modo texto usable | E2E/WEB |
| WEB-007 | 0 defectos críticos axe + revisión WCAG | accessibility/WEB |
| LLM-001 | Eventos SSE/NDJSON con schema, secuencia y requestId | contract/CONV |
| LLM-002 | Token UTF-8 cortado en chunks se reconstruye | unit/CONV |
| LLM-003 | Cancel turn anterior => ningún audio/memoria de respuesta cancelada | integration/CONV |
| LLM-004 | Chunker respeta signos y flush | unit/CONV |
| LLM-005 | Modelo inexistente muestra error claro | contract/CONV |
| LLM-006 | Fallback local→Cloud sin permiso produce cero fetch a Cloud | unit/security/CONV |
| LLM-007 | 429, timeout, 500 y respuesta vacía no cuelgan | chaos/CONV |
| LLM-008 | Inyección en memoria/usuario no cambia personalidad ni revela secretos | eval/security/CONV |
| LLM-009 | Prueba real Cloud con rama protegida; local live separada | real/CONV |
| STT-001 | Cambio proveedor STT mantiene contrato transcript | unit/STT |
| STT-002 | Denegar micro no bloquea teclado | E2E/STT |
| STT-003 | VAD no trunca silencio ni sílabas | audio/STT |
| STT-004 | Muestra 20 audios transcritos con error medido | integration/STT |
| STT-005 | local-only produce cero envíos a API externa | security/STT |
| STT-006 | Interrupción cierra audio previo | browser/STT |
| TTS-001 | Browser/local/cloud comparten interfaz | contract/VOICE |
| TTS-002 | Cola speechSynthesis, pause/cancel/fallback | browser/VOICE |
| TTS-003 | Reporte de RTF/licencias por motor | real/manual/VOICE |
| TTS-004 | Audio local válido PCM/WAV en 10 frases | integration/VOICE |
| TTS-005 | Secrets TTS solo backend; fallback por consentimiento | security/VOICE |
| TTS-006 | 20 turnos consecutivos sin audio superpuesto | E2E/VOICE |
| TTS-007 | Identidad de voz y derechos verificables | manual/VOICE |
| TTS-008 | Grupo de evaluación valida acento/pronunciación | human/VOICE |
| GFX-001 | Asset con licencia/identidad visual aprobada | manual/3D |
| GFX-002 | GLB carga esqueleto y morph targets requeridos | contract/3D |
| GFX-003 | 8-12 morphs accesibles | unit/3D |
| GFX-004 | AnimationMixer gestos sin salto brusco | visual/3D |
| GFX-005 | requestAnimationFrame sigue renderizando durante IA lenta | browser/3D |
| GFX-006 | Texturas/triángulos en presupuesto | performance/3D |
| GFX-007 | Girar produce evento 1 vez por cooldown | unit/3D |
| GFX-008 | Calidad auto mejora FPS sin apagar interfaz | perf/3D |
| AV-001 | Timeline con fragmento y audioStart monotónico | contract/AV |
| AV-002 | Visemas español se mapean a formas admitidas | unit/AV |
| AV-003 | Desfase media boca/audio <=120 ms en audios con alineación | audio/AV |
| AV-004 | Ausencia de timestamps usa fallback | unit/AV |
| AV-005 | Gesture whitelist ignora sugerencias LLM arbitrarias | security/AV |
| AV-006 | Interrupción limpia cola y avatar en <=250 ms | integration/AV |
| MEM-001 | Migraciones y backup/rollback conservan integridad | SQL/MEM |
| MEM-002 | Lore ficticio y datos jugador jamás colisionan | unit/MEM |
| MEM-003 | <14 años en España sin consentimiento legal válido: no memoria | integration/MEM |
| MEM-004 | Dos jugadores simultáneos, cero mezclas | integration/MEM |
| MEM-005 | Recuperación de memoria no altera reglas | security/MEM |
| MEM-006 | embeddings off -> FTS5 responde | unit/MEM |
| MEM-007 | borrado/export completo incluye FTS y vectores | integration/MEM |
| MEM-008 | TTL y retención cumplan política | SQL/MEM |
| CHAR-001 | 100 prompts preservan Daskalov sin cambios identitarios | eval/PERSONA |
| CHAR-002 | Lore consistente 100 preguntas | eval/PERSONA |
| CHAR-003 | 20 turnos, chiste repetido como máximo dos veces | eval/PERSONA |
| CHAR-004 | Tristeza → respuesta respetuosa | eval/PERSONA |
| CHAR-005 | 0 fallos críticos de seguridad infantil en adversarial set | audit/PERSONA |
| GAME-001 | Sesión completa contiene actividad y feedback, no solo chat | E2E/GAME |
| GAME-002 | Tres módulos con respuestas pedagógicas comprobadas | curriculum/GAME |
| GAME-003 | Reanudación opt-in no duplica progreso | integration/GAME |
| GAME-004 | Reto de pizarra usable con teclado/mouse | E2E/GAME |
| GAME-005 | Error académico da pista correcta sin humillar | eval/GAME |
| SAFE-001 | XSS/CSRF/SSRF/overload probados con entradas hostiles | security/SEC-PUBLIC |
| SAFE-002 | Consentimiento parental revisado legalmente antes de release | human/SEC-PUBLIC |
| SAFE-003 | Ruta memoria 403 con identidad ajena | integration/SEC-PUBLIC |
| SAFE-004 | CSP/headers y third-party URL policy correctas | browser/SEC-PUBLIC |
| SAFE-005 | Cota de coste por cuenta y modelo | load/SEC-PUBLIC |
| PERF-001 | Dashboard no registra datos de menores | privacy/PERF |
| PERF-002 | 5 min en PC mediano; p50 >=55 FPS con calidad adecuada | measured/PERF |
| PERF-003 | GPU modesta >=30 FPS perfil low | measured/PERF |
| PERF-004 | Primer audio por modelo, percentiles reales; fast tier aspira a <2.5 s p50 | measured/PERF |
| PERF-005 | 100 turnos sintéticos sin crecer memoria ni superponer audio | load/PERF |
| REL-001 | Gates separados rápidos/browser/real/audit sin secretos en PR | CI/FULL |
| REL-002 | Chromium/Firefox + revisiones manuales Edge | E2E/FULL |
| REL-003 | Build web con hash, assets, sin secretos | artifact/FULL |
| REL-004 | Deployment HTTPS y rollback tras migración SQL | staging/FULL |
| REL-005 | Consentimiento, voz con derechos, currículo, seguridad y métricas firmadas | human/FULL |

## GitHub Actions diseño objetivo
- **CI-fast**: push feature + PR, sin secrets, Node 24/Ubuntu 24.04, check, unit, contracts, build, <8 min objetivo.
- **CI-browser**: Playwright Chromium + Firefox, mocks IA/TTS/STT, capturas/traces sin PII, <12 min objetivo, paths selectivos o en PR.
- **CI-security**: en PR, análisis de dependencias, policy workflow, secretos, validación CSP/headers; cero secret.
- **CI-real-cloud**: SOLO desde código revisado y confianza real (workflow_dispatch en rama por defecto o tras merge autorizada + GitHub Environment con reviewers). Secret OLLAMA_API_KEY. Una llamada acotada, sin registrar contenido ni key, gasto limitado.
- **CI-real-local**: runner local dedicado/voluntario, aislado, sin secrets Cloud; si no existe, etiquetar BLOCKED_EXTERNAL.
- **CI-performance**: programación/manual en entorno controlado, comparar FPS/audio con reportes anónimos.
- **Release Gate**: exige todos los anteriores, auditoría manual de menores y voz; nunca autoriza merge por sí solo.

### Riesgo inmediato del workflow Cloud antiguo
Un secret en push a rama mutable *no* está protegido simplemente porque GitHub enmascare logs: código ejecutado con el secreto podría hacer una petición saliente. **Primera actuación obligatoria**: quitar disparador inseguro y exigir revisión / Environment antes de nuevas pruebas reales.

## SLO como hipótesis, no promesas
| Métrica | Objetivo inicial de diseño | Condición |
|---|---|---|
| FPS PC | p50 >=55 durante 5 min | perfil normal, hardware de referencia documentado |
| FPS GPU modesta | >=30 | low profile, resolución adaptada |
| TTFB LLM rápido | p50 <=1.5 s | mismo entorno/red, se mide real |
| primer audio modelo rápido | p50 <=2.5 s, p95 <=6 s | sin atribuirlo a Beam |
| primer audio Beam | registrar distribución real y expectativas en UX | no hay umbral garantizado |
| desfase labios/audio | media <=120 ms con timestamps | auditoría audiovisual |
| gap audio fragmentos | p95 <=150 ms | proveedores compatibles streaming |
| cancelación | <=250 ms desde orden | sin fragmentos tardíos |
| aislamiento de recuerdos | 0 fugas en batería adversarial | requisito absoluto |
| seguridad infantil | 0 casos críticos en 50 prompts adversariales | revisión humana |
| CI rápido | <=8 min objetivo | sin uso de Cloud |

## Evidencias por tarea
Plantilla PR/tarea:
~~~
ID: Sxx.yy
Objetivo observable:
Dado/Cuando/Entonces:
Dependencies:
Test RED (comando, SHA, fallo esperado):
Implementación (archivos y ADR):
GREEN (comando + exit code + SHA):
CI workflow/run:
Real validation (si aplica):
Métricas y comparación:
Security/privacy assessment:
Estado: TODO|IN_PROGRESS|BLOCKED_EXTERNAL|PARTIAL|VERIFIED|DONE
~~~
