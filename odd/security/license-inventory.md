# Inventario de licencias y procedencia — bloqueo de publicación

El comando `npm run security:licenses` genera un informe sin datos personales (`reports/license-inventory.json`) con versión y licencia declarada en `package-lock.json`, integridad de los paquetes y SHA256 real del GLB original. El workflow de seguridad publica este artefacto junto a SBOM y no necesita secretos.

**GLB:** malla original generada en el proyecto, sin materiales externos según `odd/character/visual-bible.md`. Se verifica hash, no la autoría jurídica de forma independiente ni aprobación artística.

**Piper:** proyecto de software con licencia MIT según su repositorio original, pero cada voz `.onnx` tiene su propia licencia y procedencia, pendientes de revisar. No se distribuye ninguna voz. **Kokoro-82M:** pesos publicados bajo Apache-2.0 en su model card; las voces/datasets y la cadena de atribución exigen revisión individual y compatibilidad con la distribución. Se requiere verificar el artefacto real elegido, su versión y cada obligación de terceros. Para síntesis comercial, revisar los términos del proveedor, uso de datos y costes en el contrato vigente.

**Estado:** ninguna casilla `voiceLicenseEvidence` o `ttsProviderReviewed` puede marcarse aprobada automáticamente por CI. El informe incluye `releaseApproved:false` intencionalmente. Falta auditoría independiente y autorización del propietario antes de `S10.06`, `VOICE-READY` y `SEC-PUBLIC`.

Referencias: https://github.com/rhasspy/piper/blob/master/LICENSE.md ; https://huggingface.co/hexgrad/Kokoro-82M .
