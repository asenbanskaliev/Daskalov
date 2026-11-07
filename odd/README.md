# ODD + TDD — Profesor Daskalov

## Documento rector
- **[Plan maestro FULL](tasks/implementacion-full-odd-tdd.md)**: backlog completo y dependencias (S00-S12), cada tarea con test y criterio de aceptación.
- **[Contratos y gates FULL](quality/full-gates-y-contratos.md)**: matriz TDD, seguridad de GitHub Secrets, Browser/E2E, métricas y certificación.
- **[ADR-002: arquitectura objetivo](architecture/adr-002-arquitectura-full.md)**: streaming IA + audio/visemas, SQLite, identidad y despliegue seguro.

## Historial previo del MVP (no borrar ni reinterpretar)
- [Plan maestro inicial](tasks/plan-maestro-odd-tdd.md): tareas F0-F6 y evidencias ya comprobadas.
- [ADR-001](architecture/adr-001-web.md): arquitectura MVP.
- [Matriz inicial](quality/matriz-tdd.md): contratos de primera versión.
- [Personalidad](character/daskalov-personality.md): estilo humorístico y límites de Daskalov.

## Cómo ejecutar
El documento FULL es una **planificación**, no prueba de implementación. Ninguna de las tareas S00-S12 se considera terminada automáticamente por haber publicado los documentos. Antes de comenzar una tanda: revisar HEAD remoto, CI de ese SHA y riesgos, crear primero tests RED, implementar GREEN, refactorizar, publicar evidencia y marcar únicamente lo realmente verificado.

**Seguridad prioritaria:** no ejecutar código de ramas editables con OLLAMA_API_KEY; proteger acceso a memoria con autenticación/autorización, no con solo playerId; no publicar producto de menores sin revisión.

- [Ejecución de la tanda de nueve mejoras](quality/tanda-nueve-siguiente.md): pruebas y estado por ID.
