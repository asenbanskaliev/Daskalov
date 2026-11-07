# Política técnica provisional — menores y memoria
**Estado:** borrador técnico; NO equivale a revisión legal ni consentimiento parental.

- Sin memoria, se puede interactuar por texto sin guardar recuerdos personales en SQLite.
- Configuración por defecto: `DASKALOV_ALLOW_MEMORY=0`. La casilla se desactiva en la UI si el servidor no habilitó la función.
- En **servidor privado de desarrollo**, una persona adulta autorizada puede activar `DASKALOV_ALLOW_MEMORY=1` y consentir desde la interfaz. Esto NO habilita una oferta pública a menores.
- Sesión de memoria por cookie aleatoria HttpOnly/SameSite Strict, propiedad del backend; no confiar en UUID de localStorage.
- Operaciones de memoria requieren cookie + token anti-CSRF; peticiones externas bloqueadas por Origin/Fetch Metadata.
- El usuario puede borrar y revocar la sesión; todavía faltan exportación, corrección, borrado de backups y mecanismos robustos de custodia.
- Los navegadores pueden proporcionar STT a través de infraestructura del proveedor; ofrecer teclado y aviso claro.
- Para una oferta a menores en España, si el tratamiento depende de consentimiento, comprobar edad y autorización parental cuando legalmente corresponda (habitualmente menores de 14 años); asesoría jurídica y verificación real son bloqueantes.
- Prohibido almacenar grabaciones de voz sin una finalidad, base legal y política de retención.
- El sistema final requiere gestión de perfiles por tutor, autorización, minimización, duración y solicitudes de supresión con verificación real.
