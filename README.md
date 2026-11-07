# Profesor Daskalov — videojuego web 3D

Proyecto educativo de humor inocente: un profesor ficticio de origen búlgaro, gruñón y entrañable, conversa con alumnos mediante Ollama Cloud o local, voz TTS y memoria opcional SQLite.

## Objetivo
Abrir el juego en el navegador con HTML, CSS y JavaScript. No es una aplicación de escritorio. Un servidor ligero Node.js se ocupa de Ollama y memoria; la clave de Cloud nunca llega al navegador.

## Desarrollo
- Rama: feat/odd-tdd-web-mvp. No fusionar automáticamente en main.
- Plan maestro: odd/tasks/plan-maestro-odd-tdd.md
- Arquitectura: odd/architecture/adr-001-web.md
- Personalidad: odd/character/daskalov-personality.md
- Pruebas: odd/quality/matriz-tdd.md

## Primera ejecución (cuando se complete la fase F0)
Requisito: Node.js 24.
1. Clona el repositorio y ejecuta `npm ci`, `npm run build` y `npm start`.
2. Abre http://localhost:3000 en Chrome o Edge. Para desarrollo HMR, inicia `npm run dev:server` y, en otra terminal, `npm run dev`; abre http://127.0.0.1:5173.
3. Para Cloud: configura OLLAMA_API_KEY en el entorno del servidor (no en HTML).
4. Para local: ejecuta Ollama local en http://127.0.0.1:11434; configura OLLAMA_LOCAL_URL del servidor si difiere.
5. Selecciona proveedor y modelo en la pantalla. La entrada por teclado será alternativa al micrófono.

Esta rama es un prototipo en desarrollo; no se considera apto para uso público por menores hasta completar las medidas de privacidad, moderación y consentimiento.

## Seguridad y memoria (fase S00)
- Por defecto `DASKALOV_ALLOW_MEMORY=0`: el chat funciona pero no crea perfiles ni recuerdos.
- Para pruebas privadas con un adulto autorizado en localhost, configurar `DASKALOV_ALLOW_MEMORY=1`. No se ha implementado todavía la verificación de consentimiento parental ni las protecciones necesarias para desplegarlo públicamente.
- Al activarla desde el navegador, el servidor emite una cookie aleatoria `HttpOnly; SameSite=Strict`; el identificador de alumno ya no lo decide el navegador. Las operaciones de memoria requieren cookie y token CSRF, y borran/revocan la sesión.
- Ollama Cloud utiliza `OLLAMA_API_KEY` solo en el servidor; GitHub Actions REAL ahora está restringido a ejecución manual desde `main` y al environment `daskalov-cloud-test`, que debe protegerse con aprobaciones desde GitHub Settings.
- El backend escucha en `127.0.0.1` únicamente. NO publicarlo todavía en Internet; faltan autenticación de acceso a Cloud, consentimiento de menores, gestión de costes en despliegue y otras medidas del plan FULL.

## Frontend reproducible S01
Three.js y Vite se instalan desde `package-lock.json`; en producción el motor 3D va incluido en los assets compilados, no en un CDN.
`npm run test:e2e` utiliza Playwright Chromium y Firefox (instalar navegadores con `npx playwright install`). GitHub Actions prueba ambos con conversaciones simuladas, sin gastar tokens Ollama.

## Modos disponibles tras la segunda tanda
- **Demo sin IA:** elegir `Demo sin IA · offline` en el proveedor. Está claramente etiquetado como guion de muestra; no usa Ollama, micro ni memoria. Tras la primera carga HTTPS/localhost, el service worker guarda **solo recursos estáticos** para recarga offline (no mensajes del alumno).
- **Cloud/local:** el modelo disponible se consulta mediante `/api/tags`; `/api/provider-status` muestra conectividad. Si escoges local, un checkbox OFF por defecto permite usar Cloud **solo cuando se autoriza** y no existe texto parcial del modelo local.
- **Voz y gráficos:** selector de voz del navegador (no garantiza acento búlgaro), pausa/reanudación, calidad baja/media/alta/automática y reducción de movimiento.
- **Privacidad y coste:** el servidor expone `/api/metrics` solo en modo local, con agregados sin conversaciones; tokens y costes son estimaciones, no la factura real del proveedor. Cuota Cloud inicial 24 solicitudes por proceso y día, insuficiente por sí sola para hosting público.
- **Estado ODD actualizado:** `odd/tasks/implementacion-full-odd-tdd.md` y `odd/quality/tanda-nueve-siguiente.md`.

**Prohibido publicar este prototipo para menores:** faltan consentimiento/verificación legal, seguridad de hosting, voz licenciada, revisión y configuración de GitHub Environment.

## Voz Piper local opcional
El selector de TTS mantiene **navegador (gratis)** como predeterminado. Con Piper instalado, configura `DASKALOV_PIPER_BIN` y `DASKALOV_PIPER_MODEL` (ruta del archivo `.onnx`); el backend ejecuta Piper sin shell, envía WAV por el mismo origen y elimina el audio temporal tras leerlo. No existe una voz con acento búlgaro licenciada/validada por defecto. Revisa individualmente licencia del motor y del modelo vocal. Para un ejemplo de CLI con `--output_file` consulta la documentación de Piper: https://tderflinger.github.io/piper-docs/guides/usage/.
