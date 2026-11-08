# AULA-001–005 · Diseño de aula inmersivo y configuración independiente

Fecha: 2026-11-08. **Rama:** `feat/odd-tdd-web-mvp`. **SHA de código y pruebas:** `b613ac5476b5af15cbdd0331f41c901b637e957c`. `main` no ha sido modificado.

## Resultado

**IMPLEMENTADO — validación automática PASS.** Se organiza la aplicación en tres zonas sin duplicar controles ni recargar la escena:

1. **Aula 3D:** ocupa la columna principal, botones visibles Ajustes / Retos / Historial / Pantalla completa, globo de subtítulos siempre accesible.
2. **Conversación:** historial y campo para escribir más accesibles desde el inicio, voz y cancelación conservadas. En el modo inmersivo se convierte en barra inferior. No se corta el turno ni se destruye la partida al cambiar de vista.
3. **Configuración:** `#settingsDrawer` superpuesto a la derecha en escritorio y bottom sheet en móvil, oculto por defecto. Contiene proveedor/modelo/API key, voz, privacidad, diagnósticos y derechos de memoria. Apertura y cierre por botón, X, fondo o Escape; roles ARIA, bloqueo de interacción externa mediante `inert` y trampa de foco de teclado.

Los retos y el historial se pliegan independientemente. Al entrar en modo inmersivo se ocultan y se pueden reabrir con los botones de la parte superior; al salir se restaura la visibilidad que tenían en la vista normal.

El botón Pantalla completa utiliza `requestFullscreen()` para todo `#mainContent`. Cuando no está permitido usa `.is-immersive` CSS, conservando chat, subtítulos, controles, tecla Escape y el mismo `canvas` Three.js con `ResizeObserver`. En navegadores móviles que no admiten pantalla completa, **el modo CSS no implica ocultar las barras propias del navegador**. No se intenta recuperar pantalla completa sin gesto del usuario tras una recarga.

## Pruebas verificadas

- [CI unitario, build y contratos: SUCCESS — ejecución 42490915317](https://github.com/asenbanskaliev/Daskalov/actions/runs/42490915317).
- [Playwright Chromium/Firefox: SUCCESS — ejecución 42490915330](https://github.com/asenbanskaliev/Daskalov/actions/runs/42490915330).
  - Chromium: **46 PASS**, 0 FAIL.
  - Firefox: **45 PASS, 1 SKIPPED**, 0 FAIL. La omisión no es de una prueba AULA.
- `e2e/aula-mode.spec.js`: AULA-001 diálogo accesible y retorno de foco; AULA-002 retos/historial plegables sin perder puntuación; AULA-003 fallback CSS con WebGL ausente y estado preservado; AULA-004 ancho 320/390 px sin overflow; AULA-005 API Fullscreen del navegador cuando se admita, y alternativa funcional cuando se rechace.
- `tests/aula-mode.test.mjs`: IDs únicos, modal ARIA, separación de chat/retos de configuración y módulo de pantalla completa sin llamadas de red.
- Pruebas anteriores de conversación real de backend determinista, TTS sin sonido, privacidad, misiones, contraste, Demo offline y renderización permanecen ejecutándose en ambas suites.

## Ficheros principales

- `index.html`: estructura del aula y los controles de vistas.
- `src/aula-mode.js`: estados y ciclo de vida de vistas, modal y Fullscreen API.
- `src/style.css`: layout escritorio, bottom sheet móvil y HUD inmersivo.
- `src/app.js`: integración mínima, sin recrear conversación ni escena.
- `e2e/support/aula.js`: utilidades de test para configurar desde el modal.
- `odd/operations/guia-uso-desarrollo.md`: instrucciones del usuario.

## Límites honestos

- La prueba de Fullscreen se realiza en navegadores automatizados, no certifica el resultado idéntico en cada iPhone, Android o monitor físico.
- La comprobación WCAG mediante lector de pantalla, pruebas táctiles humanas, rendimiento físico de GPU, proveedores LLM reales y seguridad infantil independiente siguen pendientes en el ODD maestro.
- No activa permisos de micrófono ni voz, no cambia la gestión de claves API, ni modifica `main`.
