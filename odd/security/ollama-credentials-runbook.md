# Runbook — uso seguro de OLLAMA_API_KEY
## Decisión
El secreto declarado como **Repository secret** por el propietario se puede utilizar en un workflow si este ejecuta código de confianza. Los secretos se inyectan como variables de entorno; GitHub enmascara logs pero **no evita exfiltración por código malicioso ejecutado con ese secreto**.

## Estado implantado
- `.github/workflows/ollama-real.yml` NO tiene triggers push/PR.
- `workflow_dispatch` y condición `github.ref == 'refs/heads/main'`.
- Job `environment: daskalov-cloud-test` con timeout 4 min, Node 24, token mínimo y acciones fijadas SHA.
- No ejecutar la prueba Cloud desde ramas no revisadas ni hacer merge automático.
- El workflow no estará disponible para dispatch desde la UI de GitHub hasta que exista en la rama por defecto main, luego de una revisión y merge autorizados.

## Configuración pendiente del propietario
1. En GitHub: Settings → Environments → New environment: `daskalov-cloud-test`.
2. Añadir Required reviewers. Restringir deployments a rama `main`, preferentemente protegida.
3. Idealmente, mover `OLLAMA_API_KEY` de Repository secrets a los secrets de ese Environment; revocar el anterior.
4. Tras aprobar el código que leerá la clave y haber fusionado a main **con autorización**, ejecutar manualmente el workflow REAL.
5. Confirmar status/coste y revisar logs, sin mostrar nunca la API key.

## Rotación
1. Revocar la clave antigua en Ollama.
2. Generar nueva clave y actualizar secret del Environment, no código.
3. Probar manualmente con cuotas bajas en main; revisar que no hay tokens en logs.
4. Registrar fecha y hash SHA del workflow revisado (NUNCA el valor del secreto).

## Respuesta a sospecha de filtración
Deshabilitar workflows REAL, revocar inmediatamente clave, consultar registros y presupuesto, corregir causa, revisar historial de GitHub y reactivar solo tras revisión.
