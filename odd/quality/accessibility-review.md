# Accesibilidad: criterios WCAG 2.2 AA (revisión humana pendiente)

Ruta de teclado universal: enlace visible al enfocarse que salta a la pregunta, input y botones nativos con etiquetas, historial y subtítulos visibles en texto, lecciones por botones, sin obligatoriedad de micrófono ni WebGL.

Controles: voz opt-in con mute/cancelación y pausa, opción solo teclado, subtítulos persistentes, reducción de movimiento del sistema o usuario, selectores con foco visible y contrastes reforzados.

Automatizado: e2e/accessibility-mobile.spec.js, tests/accessibility-ui.test.mjs, Playwright Chromium/Firefox. Se prueban 375 px, skip link, reduced-motion, envío por texto y ausencia de WebGL.

No afirmar conformidad WCAG AA todavía: queda auditoría independiente con axe-core, lector de pantalla NVDA/VoiceOver, navegación completa con teclado, contraste medido, zoom 200/400%, dispositivos táctiles, Edge/Chrome reales y revisión de lenguaje comprensible.

Queda también pendiente consentimiento infantil verificable y avisos STT en navegador.

El E2E nuevo `e2e/contrast.spec.js` calcula ratio de contraste a partir de estilos computados en controles, botones y mensajes, con mínimo 4.5:1. Su alcance es parcial: fondos translucidos, estados hover, gradientes, contrastes de iconos y evaluaciones de lectores de pantalla necesitan revisión especializada.
