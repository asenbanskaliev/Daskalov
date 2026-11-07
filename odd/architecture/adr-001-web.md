# ADR-001: arquitectura WEB primero
Estado: ACCEPTED (diseño inicial). 2026-11-07.

## Decisión
Frontend HTML5/CSS/JavaScript, renderizado 3D con Three.js y assets glTF/GLB (modelo procedural en MVP). Servidor Node.js 24 con API de mismo origen. Persistencia SQLite local (FTS5) solo cuando el usuario active memoria; memoria desactivada por defecto. Adaptador Ollama Cloud/local. TTS desacoplado de Ollama y micrófono con fallback teclado.

## Razones
El juego se abre en el navegador, no se instala como app. El render corre a FPS independientes de las llamadas a LLM. El servidor evita exponer OLLAMA_API_KEY y simplifica CORS; el código de navegador no recibe ningún secreto. Node.js integrado permite MVP sin servicios de pago salvo la inferencia Cloud.

## Ollama
Cloud: POST https://ollama.com/api/chat, Authorization: Bearer OLLAMA_API_KEY, modelo beam (nombre API Cloud), respuesta no streaming en MVP. Local: POST http://127.0.0.1:11434/api/chat con modelo instalado. El endpoint local está definido por el administrador del servidor, nunca por una URL arbitraria enviada desde el navegador (mitiga SSRF). Beam puede ser lento; implementar streaming por frases en fase F3.

## Voz
MVP: SpeechRecognition en navegadores compatibles + speechSynthesis del sistema, ambos con fallback de texto. Esta solución no garantiza el acento búlgaro. Posterior: motor TTS dedicado multilingüe con voz consentida y playback Web Audio; evaluar calidad, latencia y licencia antes de elegir.

## Memoria y protección
No almacenar audio. Opt-in de memoria por jugador; identificador aleatorio de 128 bits en navegador. SQL parametrizado, FTS5 con consulta saneada, límite de contexto, TTL, endpoint de borrado. La identidad mediante token aleatorio del MVP no sustituye autenticación y consentimiento parental en producción. Separar autobiografía ficticia del profesor de recuerdos reales del alumno.

## Trampas evitadas
- Ningún acceso a secrets en PR de forks; job real de Cloud únicamente en push de rama propia o ejecución manual autorizada.
- Nada de API key en JS/HTML, archivos env ni artefactos.
- No prometer que un archivo index.html abierto con file:// pueda conectar directamente a Ollama Cloud: se necesita servidor por seguridad.
- No guardar salidas del LLM como HTML ni ejecutar comandos generados.
- Limitar solicitudes para controlar coste y evitar abuso del endpoint público.
- No dar por garantizados JSON estructurado, acento nacional ni 60 FPS sin test real.
