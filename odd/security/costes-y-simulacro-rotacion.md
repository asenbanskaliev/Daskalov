# S00.07 — Presupuesto de Cloud y simulacro de revocación
Fecha: 2026-11-07. Estado PARTIAL: registros y pruebas sintéticas, NO rotación real de la clave.

## Controles implantados
- Servidor Node escucha localhost, Cloud solo accesible desde host local. **Host no es autenticación para despliegue público**: está prohibido publicar este servidor sin gateway autenticado.
- Cuota agregada de solicitudes Cloud por proceso: 24/día de forma predeterminada, además de límites por IP y concurrencia. Si hay varios servidores/replicas, **cada uno tiene su cuota**. Para producción se requiere contador distribuido.
- Si un turno local falla, se utiliza Cloud solo si el jugador marca expresamente la casilla. No se mezclan respuestas parciales.
- Las pruebas CI de Cloud no se ejecutan desde PR ni rama editable. Requieren workflow manual en main y el environment \`daskalov-cloud-test\` con revisión.
- La API /api/metrics muestra solo percentiles, errores, tokens estimados por caracteres y coste estimado opcional. **NO es facturación real** y excluye tokens de entrada/caché.

## Presupuesto
El propietario debe fijar un límite mensual de gasto en el proveedor y configurar, si conoce el precio, \`DASKALOV_USD_PER_1M_OUTPUT_TOKENS\`. Si la tarifa es desconocida, el coste se representa como **desconocido**, nunca cero. El límite de 24 solicitudes no garantiza un techo en euros: cada petición puede consumir tokens distintos.

## Simulacro seguro de rotación (sin exponer claves)
1. Test unitario configura una credencial ficticia \`FAKE_A\` y confirma que solo el backend crea el encabezado Bearer.
2. Cambia a \`FAKE_B\`, repite la llamada mock y verifica que \`FAKE_A\` no se reusa ni se almacena en SQLite/logs.
3. Simula retirada: elimina la variable y comprueba error 503 sin transmisión.
4. **Pendiente de acción real:** revocar la clave auténtica desde Ollama, generar una nueva, moverla al Environment protegido y efectuar prueba manual tras revisión/merge autorizado. No se puede simular ni certificar este acto externo desde un CI sin acceso al secreto.

## No-go
Sin autenticación segura de jugadores, sin requisitos de privacidad de menores, sin control distribuido de presupuesto y sin revisión de seguridad, el juego solo puede ejecutarse en modo local/privado, no publicarse como servicio abierto.
