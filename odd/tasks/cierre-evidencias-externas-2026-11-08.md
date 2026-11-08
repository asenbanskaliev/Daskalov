# Daskalov — 25 contratos pendientes tras 84/109 DONE

Fecha: 8 de noviembre de 2026. Rama `feat/odd-tdd-web-mvp`. Este documento **no es una aprobación de release**. La rama conserva los cambios y el ODD maestro describe pruebas automatizadas y gates. Los 25 contratos siguen abiertos hasta contar con evidencia real independiente y comprobar los resultados. No reproducir voces de menores en CI ni colocar secretos en issues.

## Acceso/entorno seguro — 3

| ID | Paso para el responsable y evidencia verificable |
|---|---|
| S00.01 | Propietario configura GitHub Environment `daskalov-cloud-test` con reviewers obligatorios, añade únicamente allí la clave, elimina exposición no protegida y prueba que un workflow de PR no puede acceder al secreto; inspección de ajustes que no exponga la clave |
| S00.05 | Diseñar y revisar autenticación pública con proveedor de identidad, roles tutor/alumno e invitado, revocación, presupuestos y cuotas por identidad y abuso; test de autorización real. Hasta entonces **Cloud solo loopback, modo demo para acceso público** |
| S02.09 | En código confiable en `main`, únicamente tras aprobación de propietario, ejecutar dispatch Cloud Beam con Environment y comprobar conversación completa/stream y cancelación; evaluar también un runner privado con Ollama local real. No falsificar con mocks |

## Voz, modelos y evaluación pedagógica — 7

| ID | Paso para el responsable y evidencia verificable |
|---|---|
| S03.07 | 20 archivos de voz adultos/licenciados para casos difíciles del plan `odd/quality/stt-tts-real-evaluation.md`; probar Chrome/Edge/Firefox, WER y permisos, sin subir audio ni texto personal |
| S04.03 | Instalar Piper y Kokoro reales con modelos/voces verificadas y licencias; medir en el mismo equipo CPU/RAM, inicio, RTF y calidad sobre frases idénticas; ejecutar `npm run eval:voice` con datos autorizados |
| S04.07 | Contratar o autorizar una voz original grave, clara y teatral con influencia búlgara, registrar contrato de uso de voz y derechos de entrenamiento/distribución, pronunciación de nombres y atribuciones |
| S04.08 | Panel ciego con al menos tres jueces independientes, incluidos hablantes búlgaros y especialistas en español educativo; registrar valoraciones, desacuerdos y consentimiento |
| S08.06 | Ejecutar los 300 escenarios reproducibles contra modelo local real; guardar solo indicadores agregados y SHA del dataset/modelo; `DASKALOV_EVAL_LIMIT=300`, baseline y regresiones. El contrato estático no equivale a aprobación del modelo |
| S08.07 | Evaluación humana de humor escolar, seguridad, conocimiento histórico, precisión y diferenciación de ficción; auditar respuestas erróneas con rúbrica firmada y observaciones sin datos de menores |
| S09.09 | Ejecutar diez sesiones completas sobre cada versión candidata; valorar con docentes la claridad, corrección y motivación, incluyendo variantes de accesibilidad. Las diez sesiones sintéticas ya están probadas |

## Privacidad, menores y accesibilidad — 8

| ID | Paso para el responsable y evidencia verificable |
|---|---|
| S01.07 | Auditoría WCAG 2.2 AA completa en PC/móvil con foco/teclado, 200-400 % zoom, lectores NVDA/VoiceOver, axe o equivalente, contraste y voz desactivada, corregir defectos y revalidar |
| S07.03 | Encargar revisión de base jurídica para memoria de menores en España y flujo verificable de tutor/edad/finalidades; memoria desactivada hasta autorización legal por persona competente |
| S07.07 | Evidenciar exportar/corregir/revocar/borrar en almacenamiento y backups remotos, incluida cadena de copias históricas; el ledger HMAC local previene resurrección pero no elimina copias externas |
| S10.02 | Revisión jurídica infantil de información comprensible, finalidad, proveedores y tratamiento de audio/STT/TTS; consentimientos auditables por el responsable, no casillas falsas |
| S10.07 | Comprobar infraestructura de logs, copias, rotación y supresión en todos los servicios, no solo SQLite; respuesta verificada a solicitud de borrado |
| S10.09 | Auditoría de seguridad independiente del código y staging y evaluación de menores. Autorizar Internet solo después de revisar las evidencias y corregir hallazgos críticos |
| S11.07 | Rondas reales en móviles/táctil con y sin micrófono, sin WebGL y con modo reducido; comparar capturas con referencias y lector de pantalla |
| S10.06 | Revisar inventario `npm run security:licenses` con licencias de voz/modelos, derechos del avatar GLB, cadena de suministro y términos comerciales; aprobación humana documentada |

## 3D, rendimiento y publicación — 7

| ID | Paso para el responsable y evidencia verificable |
|---|---|
| S05.06 | Completar/verificar iluminación estática horneada, texturas con compresión cuando existan, instancias, culling y presupuesto de GPU, junto a comparativa antes/después en hardware; los muebles ya se agrupan |
| S05.09 | Revisión artística manual de capturas deterministas en PC y móvil y aprobación explícita del rig, expresiones y aula; no basta la comparación automática |
| S11.02 | Benchmarks reales en Chrome/Edge/Firefox del GLB, VRAM, texturas, triángulos y draw calls; documentar dispositivo y condiciones sin identificadores personales |
| S11.03 | Medir al menos cinco minutos p50 FPS ≥55 en PC corriente y ≥30 en hardware modesto, calibrar calidad adaptativa donde falle |
| S11.04 | Medir latencia primera voz y p50/p95 en modelos rápidos reales, por separado de Beam, con condiciones estables y sin publicar conversaciones |
| S11.08 | Ejecutar comparaciones antes/después equivalentes en equipo físico con `npm run perf:compare -- <antes.json> <despues.json> <salida.json>`, atender regresiones y autorizar resultados |
| S12.05 | Despliegue de staging HTTPS con rollback de binario/esquema SQL y restauración cifrada, mantener ledger HMAC de borrados, health y `DASKALOV_SMOKE_EXPECT_DEMO=1`; documentar rollback real sin datos de menores |

## Criterio final

Cada tarea exige ID, SHA del commit, pruebas, artefacto externo con fecha/responsable y veredicto. `npm run gate:full` debe seguir bloqueado hasta 109/109, 12 gates y atestación externa Ed25519. No fusionar ni publicar sin permiso del propietario. Ningún resultado de CI con mocks reemplaza licencias, evaluadores, hardware o permisos legales.
