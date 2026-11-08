# Daskalov — pruebas reales NVIDIA, 8 de noviembre de 2026

**Resultado: NO PASA el gate de inferencia real.** El secreto `NVIDIA_API_KEY` se inyectó en GitHub Actions, pero no se imprimió ni se volcó a archivos. Las pruebas enviaron únicamente una frase genérica, sin datos de menores. El catálogo autenticado devolvió HTTP 200 y **84 IDs**, pero no se obtuvo ninguna respuesta de completions exitosa.

| Run de GitHub Actions | Operación | Resultado |
|---|---|---|
| [42482142465](https://github.com/asenbanskaliev/Daskalov/actions/runs/42482142465) | Llama 3.1 8B | Chat HTTP 410 |
| [42482245297](https://github.com/asenbanskaliev/Daskalov/actions/runs/42482245297) | Llama 3.1 8B con diagnóstico seguro | Chat HTTP 410 |
| [42482335851](https://github.com/asenbanskaliev/Daskalov/actions/runs/42482335851) | GPT-OSS-120B | Chat HTTP 410 |
| [42482486255](https://github.com/asenbanskaliev/Daskalov/actions/runs/42482486255) | Catálogo GET y DeepSeek V4 Flash | Catálogo 200, chat 410 |
| [42482625031](https://github.com/asenbanskaliev/Daskalov/actions/runs/42482625031) | Elegir modelo del catálogo (Nemotron 3 Super) | Catálogo 200, 84 modelos; chat 404 |
| [42482778144](https://github.com/asenbanskaliev/Daskalov/actions/runs/42482778144) | Intentos acotados de modelos del catálogo | Catálogo 200; modelos seleccionados sin inferencia exitosa |

La documentación NGC (https://docs.nvidia.com/ngc/latest/ngc-user-guide.html) especifica que el rol **Public API Endpoints User** habilita permisos sobre endpoints NIM. Otras personas han comunicado el mismo patrón 200 listado / 410 inferencia en el foro NVIDIA (https://forums.developer.nvidia.com/t/request-to-enable-public-api-endpoints-http-410-on-chat-completions/386918). **Hipótesis, no hecho confirmado:** la organización o clave personal podría no tener habilitado este rol, o algunos modelos pueden haber sido retirados.

## Próxima evidencia externa necesaria

1. En NGC, el propietario debe comprobar que su organización y usuario tienen permiso **Public API Endpoints**. Si no, solicitar activación a NVIDIA Developer Support. No compartir la clave.
2. Generar o rotar una clave con ese servicio habilitado y configurar **solo el Environment protegido** `daskalov-cloud-test`, con required reviewers, usando `DASKALOV_ENV_NVIDIA_API_KEY`.
3. Tras revisar/autorizar la fusión del workflow a `main` (todavía **no** realizada), lanzar el dispatch manual `nvidia-real-smoke.yml`, confirmar el gasto y exigir **respuesta normal y streaming validada**.
4. Solo después, decidir si ejecutar el workflow `nvidia-persona-real.yml` de 20 y posteriormente 300 escenarios; conservar reportes agregados sin prompts, claves ni texto generado.
5. No cerrar S08.06, S10.09 ni ningún gate de seguridad/voz/pedagogía mientras falten revisión docente, humana y legal.

**La ejecución puntual sobre la rama editable se deshabilitó**: el workflow final es main-only y requiere Environment con secreto propio. Los registros muestran solo códigos HTTP, modelo y métricas técnicas no personales.

## Estado

- Integración de catálogo y UI: implementada y probada con mocks.
- Modelos ofrecidos por la API: 84 IDs observados en el momento de la prueba.
- Inferencia NVIDIA real: **NO VALIDADA**.
- Ollama Beam real: **NO VALIDADO**.
- 300 escenarios reales: **NO EJECUTADOS** (runner y tests sintéticos preparados).
- 109/109 FULL: **NO**, siguen tareas y firmas externas pendientes.
