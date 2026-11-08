# Registro de riesgos — Daskalov
Fecha: 2026-11-07 · Responsable: propietario del repositorio + responsable técnico.

| ID | Riesgo | Severidad | Situación actual | Criterio de cierre |
|---|---|---|---|---|
| R-01 | API key Cloud en ejecución de código mutable | Crítico | Mitigado en workflow (manual, main). Falta protección Environment | Revisión obligatoria + secreto trasladado a Environment y test policy |
| R-02 | Acceso cruzado a memoria por playerId | Crítico | Mitigado en MVP local con sesiones cookie HttpOnly+CSRF | Tests multiusuario/reinicio y auditoría antes de público |
| R-03 | Menores sin consentimiento válido | Crítico | Memoria OFF por defecto | Validación jurídica y flujos parentales comprobados |
| R-04 | Cloud público sin login/cupos distribuidos | Alto | Backend escucha en 127.0.0.1; cuotas IP/día locales | Gate de autenticación antes de abrir red |
| R-05 | Voz falsa con acento o derechos insuficientes | Alto | Web Speech sin identidad búlgara | Contratos/licencia y ensayo con hablantes |
| R-06 | Three.js desde CDN externo no empaquetado | Medio/Alto | Pendiente S01.01 | npm lock + bundling local y CSP sin código remoto |
| R-07 | Dependencias vulnerables/cadena de suministro | Alto | Actions SHA-pinned | lockfile, escaneo y actualizaciones revisadas |
| R-08 | Alucinaciones y humor inapropiado en menores | Crítico | Prompt y pruebas mock únicamente | dataset 100/50 con revisión humana |
| R-09 | Audio/micro transmitido sin permiso | Crítico | Web Speech puede usar servidor del navegador | Opción de STT local y aviso previo |
| R-10 | LLM bloqueado / respuesta vacía Beam | Medio | Timeout y tokens 2048 probados en Cloud | Streaming/cancelación/medición p95 |
| R-11 | Fuga de datos privados en artefactos CI | Alto | Tests sintéticos, no audio ni mensajes reales | Escaneo artefactos e inspección |
| R-12 | Disponibilidad y precio Ollama Cloud variables | Medio | Desacoplado Cloud/local | cuotas + fallback local explícito |
| R-13 | Despliegue sin HTTPS o cabeceras | Alto | localhost solamente | CSP HTTPS cookies secure y ensayo |
| R-14 | Memoria huérfana tras borrado/expiración | Medio | TTL 30 días y borrado manual | export/borrado integral con backups |

## Revisión de gate
La aplicación **NO** está autorizada para publicación dirigida a menores mientras cualquier riesgo crítico permanezca abierto. No colocar NUNCA información real de alumnos, credenciales ni grabaciones en fixtures, issues, logs o artefactos de GitHub.

## Ritmo de seguimiento
Revisar en cada PR o incidente que afecte a acceso, memoria, proveedor de IA, voz o menores. Documentar riesgo, test de mitigación, commit y responsable que revisó.

## Defensa añadida para S00.01 / S00.05 (8 noviembre 2026)
El workflow Cloud manual usa un secreto de Environment con **nombre propio** `DASKALOV_ENV_OLLAMA_API_KEY` y opción de confirmación de pago; la aplicación rechaza incluso rutas de Ollama local si `Host` o socket no demuestran loopback. Faltan revisar los ajustes de protección de GitHub Environment y diseñar autenticación pública real. No se ha habilitado Internet.
