# Guía de uso y desarrollo — Profesor Daskalov

## Requisitos y alcance
- Juego web HTML/JavaScript/Three.js con backend Node.js 24. Es un prototipo de desarrollo en rama feat/odd-tdd-web-mvp.
- Uso previsto en pruebas privadas de personas adultas autorizadas. NO se ha aprobado para publicación pública dirigida a menores.
- No se incluyen servicios de voz externos ni se almacenan claves en el cliente. Cloud puede generar costes; se limita el acceso desde el servidor.

## Modo Aula inmersivo y controles de vista (AULA-001 a AULA-004)
- **Ajustes** (icono de engranaje, arriba a la derecha del aula): abre el panel de configuración superpuesto. En móvil aparece como hoja inferior desplazable. Ningún campo de modelo, API key, privacidad ni voz se pierde al cerrarlo. Se cierra con X, clic fuera o `Esc`; el foco vuelve al botón que lo abrió.
- **Retos**: muestra u oculta las lecciones y eventos del aula sin reiniciar la partida ni borrar puntuaciones. Al entrar en pantalla completa comienza oculto para no tapar al personaje y se puede volver a abrir.
- **Historial**: permite ocultar y recuperar la transcripción; el campo para preguntar y los subtítulos permanecen disponibles.
- **Pantalla completa**: solicita la Fullscreen API sobre el aula **junto al chat**, no sobre el canvas solamente. Si el navegador la prohíbe (por ejemplo, en ciertos móviles), ofrece un diseño inmersivo CSS que ocupa el área visible; no equivale a eliminar siempre las barras del navegador. Pulsa otra vez el botón o `Esc` para salir. Los botones mantienen nombre accesible, estado ARIA y foco de teclado.
- **Vista normal**: chat antes de los retos para poder escribir sin desplazarse a través del formulario técnico. La configuración comienza oculta por defecto y los retos son plegables.
- El botón Interrumpir continúa disponible durante las respuestas; las frases del profesor permanecen como subtítulos sobre la escena, incluso sin micrófono ni WebGL. El cambio de vista no vuelve a crear la escena Three.js ni lanza una llamada de IA.
- Las claves API y consentimientos siguen siendo efímeros. La preferencia de pantalla completa **no se restaura automáticamente al recargar**, porque los navegadores requieren una acción del usuario y no debe sorprenderle una pantalla bloqueada en el modo inmersivo.
- Pruebas automatizadas: `e2e/aula-mode.spec.js` (modal, foco, teclado, modo alternativo, estado, 320/390 px), `tests/aula-mode.test.mjs`, y suite de regresión de chat/lecciones/voz. No son una auditoría de accesibilidad con lector de pantalla o una validación de hardware físico.

## Probar el modo demo sin Ollama
1. Instalar Node.js 24 y Git; clonar el repositorio y elegir la rama de desarrollo.
2. Ejecutar `npm ci`, `npm run build`, `npm run verify:build` y `npm start`.
3. Abrir `http://127.0.0.1:3000`; pulsar **Ajustes** (engranaje) y en Proveedor elegir `Demo sin IA · offline`. Cerrar Ajustes para hablar con Daskalov.
4. Seleccionar Matemáticas, Lengua o Historia, nivel básico/intermedio/avanzado y contestar con el teclado. La pizarra muestra preguntas.
5. Los botones permiten levantar mano, girar, mirar al frente y activar eventos del aula si se desea. La opción de eventos ocasionales está desactivada por defecto.
6. Tras la primera visita desde HTTPS o localhost, el service worker guarda únicamente archivos estáticos; ninguna pregunta, audio o respuesta se escribe en su caché.

## Ollama local (privado)
1. Instalar Ollama en el mismo equipo que ejecuta el backend; comprobar que escucha en `http://127.0.0.1:11434`.
2. Descargar un modelo de conversación autorizado desde el propio Ollama y verificar su etiqueta exacta.
3. Configurar `OLLAMA_LOCAL_URL=http://127.0.0.1:11434` en el entorno del backend y reiniciar Node.
4. Elegir Ollama local en la interfaz, consultar la lista de modelos y enviar una pregunta de prueba.
5. No marcar la casilla de fallback a Cloud salvo consentimiento expreso de la persona adulta. La casilla está desactivada de inicio.
6. Para embeddings opcionales: configurar `DASKALOV_ENABLE_LOCAL_EMBEDDINGS=1`, `DASKALOV_EMBED_MODEL=<modelo>` y ejecutar el reindexado autenticado. Si no está configurado, la memoria usa FTS5.

## Ollama Cloud (solo pruebas privadas)
1. Configurar `OLLAMA_API_KEY` exclusivamente como variable del proceso backend; nunca en `index.html`, JS, localStorage, issues o README.
2. Elegir Cloud y modelo de la lista si el endpoint está disponible.
3. Las pruebas reales de GitHub Actions requieren código confiable en `main`, un Environment `daskalov-cloud-test` con aprobación humana y un secreto de Environment; el `Repository secret` por sí solo NO protege código editable.
4. No ejecutar manualmente el workflow Cloud de una rama de desarrollo, ni publicar el backend fuera de loopback. La cuota de 24 solicitudes Cloud por proceso no sustituye autenticación ni un presupuesto económico.

## Reconocimiento de voz (STT)
- Navegador: solicitará permiso de micrófono al pulsar; Web Speech puede recurrir a un servicio del navegador y su privacidad depende de ese proveedor.
- Solo teclado: deshabilita el micrófono y conserva todas las lecciones por texto.
- Whisper local: instalar por separado un servidor whisper.cpp compatible en 127.0.0.1, configurar `DASKALOV_WHISPER_URL` y verificar formato WebM/OGG. No se incluye ni descarga automáticamente el modelo.
- Grabación temporal y límite máximo de duración; opción VAD de fin de frase disponible. El servidor rechaza archivos excesivos y no guarda audio en SQLite.

## Síntesis de voz (TTS)
- Navegador: opción gratuita dependiente de las voces instaladas, con selección, pausa, reanudación y cancelación; no garantiza acento búlgaro.
- Piper local: instalar binario Piper, obtener una voz española `.onnx` con licencia aprobada y configurar `DASKALOV_PIPER_BIN` y `DASKALOV_PIPER_MODEL`.
- El backend ejecuta Piper sin shell, elimina los archivos WAV temporales y entrega WAV por el mismo origen; es una integración con tests simulados, no una voz profesional validada.
- El movimiento de boca estima visemas, y los clips del avatar GLB de 6 KB son básicos; no sustituyen una rig facial, lipsync de audio real ni revisión del acento.

## Memoria SQLite
- Está desactivada en el servidor por defecto. Solo en pruebas privadas autorizadas activar `DASKALOV_ALLOW_MEMORY=1`.
- La sesión usa cookie HttpOnly y CSRF. Un identificador elegido por el navegador NO concede acceso a recuerdos.
- Opciones: visualizar, exportar JSON, corregir y borrar recuerdos; el progreso educativo es opcional.
- Límite de 200 recuerdos, retención de 30 días, progreso 180 días, sin persistencia de audio. Los correos/teléfonos/documentos detectables se redactan.
- Hay FTS5 y embeddings opcionales **solo de Ollama local**, con aislamiento por jugador y checksum. El reindexado privado requiere sesión válida y CSRF.
- Los backups antiguos pueden conservar datos; es obligatorio diseñar borrado de backups, consentimiento de tutor y revisión jurídica antes de uso público.

## Desarrollo y tests
- Ejecutar `npm run check`, `npm test`, `npm run build`, `npm run test:e2e`, `npm run security:sbom`.
- `npm run gate:status` informa el número ODD; `npm run gate:full` falla hasta tener 109/109 y evidencia externa Ed25519 para el SHA exacto.
- `npm run eval:persona:static` verifica 300 escenas sintéticas sin IA ni coste. Para evaluación real de un modelo local: usar el comando de evaluación opcional y consentimiento explícito; no evalúa Cloud automáticamente.
- GitHub Actions separa CI rápido, pruebas Playwright en Chromium/Firefox, seguridad, rendimiento sintético y Cloud manual restringido.
- Las ejecuciones con mocks no confirman latencias, FPS, pronunciación, seguridad real del modelo ni cumplimiento legal.

## Operaciones y solución de problemas
- Modelo no listado: comprobar Ollama local, que exista el modelo descargado, configuración del backend y acceso a `/api/models?provider=local`.
- Ollama Cloud no responde: validar secreto solo en backend, límites de cuotas y que se prueba desde localhost.
- No hay voz: verificar permisos de micrófono, navegador, selector STT/TTS y configuración del servicio Piper o Whisper instalado. El modo teclado sigue disponible.
- WebGL no funciona: usar interfaz de texto y calidad gráfica baja. Si el GLB no carga, se usa personaje procedural.
- Fallan tests de navegador: volver a ejecutar `npx playwright install --with-deps chromium firefox`, revisar `playwright-report` y `test-results`; nunca subir trazas con conversaciones privadas.
- Error SQLite: detener servidor, copiar base a un lugar seguro, comprobar versión/`PRAGMA quick_check`, restaurar backup íntegro y evitar abrir un esquema nuevo con binarios antiguos.
- Seguridad/HTTPS: el Dockerfile está restringido a demo pública sin API de IA ni datos. No retirar esa protección ni permitir menores sin verificación independiente.

Documentos asociados: `odd/tasks/implementacion-full-odd-tdd.md`, `odd/quality/full-release-gate.md`, `odd/operations/deploy-and-rollback.md`, `odd/security/riesgos-y-bloqueos.md`.

## Condición Cloud del workflow protegido
En Settings → Environments configurar `daskalov-cloud-test`, limitar a rama predeterminada y exigir **required reviewers**. Añadir el secreto de Environment `DASKALOV_ENV_OLLAMA_API_KEY`, **no** como repository/org secret; eliminar claves anteriores de ámbitos menos protegidos. Tras revisión/merge autorizado a `main`, un operador puede lanzar el dispatch con `confirm_paid_test=true`. Sin esta autorización y ese secreto, el job no envía tráfico ni debe considerarse una prueba real. Los tests públicos del proxy solo permiten `/api/health` y archivos demo, no LLM local ni Cloud.

## Benchmark real de aula 3D en Windows (pendiente de ejecución humana)
Instalar navegadores soportados por Playwright con `npx playwright install chrome msedge firefox` y arrancar `npm start` en un terminal con Daskalov privado en 127.0.0.1:3000. En PowerShell configurar `$env:DASKALOV_HARDWARE_BENCH_CONSENT="1"` y `$env:DASKALOV_EXPECTED_SHA="<SHA-exacto-40-hex>"`. Ejecutar por ejemplo `npm run perf:hardware:local -- chrome normal low 1280x720 resultado-chrome.json` y repetir para `edge` y `firefox`, y para hardware modesto `low`. Se abre un navegador **visible** y se recopilan deltas de fotogramas durante cinco minutos, con IA y memoria bloqueadas por la prueba. Los resultados se exportan solo en agregados FPS, sin audio o historial. Si no hay WebGL/GLB, la prueba falla y no reporta FPS ficticios. Ejecutar en el equipo objetivo en primer plano, sin otros procesos intensivos. Revisar el equipo y resultados; el reporte no prueba por sí mismo VRAM ni conformidad de release. Comparar dos SHA con `npm run perf:compare -- antes.json despues.json diff.json` manteniendo el mismo navegador, tier, calidad y resolución.
