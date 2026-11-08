# Release gate FULL (por defecto bloqueado)

El progreso ODD requiere 109 casillas completadas y los 12 gates externos verificados: SEC-READY, WEB-READY, CONV-READY, STT-READY, VOICE-READY, 3D-READY, AV-READY, MEM-READY, PERSONA-READY, GAME-READY, SEC-PUBLIC, PERF-READY.

- npm run gate:status: informe informativo, no declara FULL.
- npm run gate:full: devuelve error hasta contar con 109/109 tareas, SHA exacto y una revisión externa firmada Ed25519.
- DASKALOV_EXPECTED_SHA (o GITHUB_SHA) identifica el commit exacto.
- DASKALOV_RELEASE_ATTESTATION_PATH apunta a un archivo externo al PR, autorizado por el revisor.
- DASKALOV_RELEASE_PUBLIC_KEY debe venir de un entorno de confianza y no puede ser controlado desde la rama editada.
- El acta firmada contiene sha, issuedAt, reviewer y gates; cada gate contiene name, status=passed y evidencia HTTPS. Se firma la serialización JSON canónica de esos campos.
- Una firma auténtica no demuestra por sí sola calidad: comprobar independientemente los informes de seguridad infantil, licencias de voz, pruebas reales y permisos del propietario.
- La ejecución del control no realiza merge, no despliega y no accede a la clave OLLAMA_API_KEY.

Se prohíbe fabricar aprobaciones para desbloquear FULL. El último CI de mocks jamás reemplaza una prueba real de Cloud ni una evaluación humana.
