# ODD + TDD — Daskalov
ODD significa desarrollo orientado a resultados observables: una función solo se completa cuando un usuario puede comprobarla y existen pruebas que lo demuestran.
TDD: definir una prueba que falla (RED), implementar el mínimo (GREEN), mejorar el código manteniendo la prueba (REFACTOR).

Documentos normativos del proyecto:
- tasks/plan-maestro-odd-tdd.md — fases y checklist ejecutable.
- architecture/adr-001-web.md — decisiones de tecnología, seguridad y despliegue.
- character/daskalov-personality.md — identidad, estilo y límites del personaje.
- quality/matriz-tdd.md — pruebas y gates.

Normas:
- Trabajar en ramas y PR. No fusionar main sin autorización.
- Distinguir pruebas mock, pruebas reales de API y revisión manual de voz/gráficos.
- No marcar tareas como completas sin evidencia reproducible.
- Optimizar GitHub Actions: gates rápidos para cambios normales; smoke REAL separado con tokens limitados.
- Ningún secreto o información privada de alumnos se introduce en fixtures, capturas ni logs de CI.
