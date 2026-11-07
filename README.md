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
1. Clona el repositorio y ejecuta npm start.
2. Abre http://localhost:3000 en Chrome o Edge.
3. Para Cloud: configura OLLAMA_API_KEY en el entorno del servidor (no en HTML).
4. Para local: ejecuta Ollama local en http://127.0.0.1:11434; configura OLLAMA_LOCAL_URL del servidor si difiere.
5. Selecciona proveedor y modelo en la pantalla. La entrada por teclado será alternativa al micrófono.

Esta rama es un prototipo en desarrollo; no se considera apto para uso público por menores hasta completar las medidas de privacidad, moderación y consentimiento.
