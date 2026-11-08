# Política de uso, privacidad, accesibilidad e incidentes — versión preliminar

## Alcance y prohibiciones
Solo demostraciones locales privadas para adultos o demostración guionizada sin IA ni memoria. No desplegar como plataforma para menores ni habilitar Cloud público sin autenticación, revisión jurídica, derechos de voz y autorización del propietario.

## Transparencia y control del usuario
Se debe mostrar claramente cuando se utiliza Ollama Cloud, Ollama local, Web Speech del navegador o Whisper/Piper locales. El dictado del navegador puede usar servicios externos; la memoria y el envío a Cloud no se activan por defecto. Se conservan subtítulos, teclado, controles de pausa y reducción de movimiento.

## Derechos de acceso y supresión
Las acciones de ver, exportar y corregir memoria requieren sesión privada y CSRF; desmarcar Recordar inicia borrado de datos asociados a esa sesión. El usuario puede usar el botón Borrar recuerdos. Una sesión de invitado no es una identidad parental verificada.

Una solicitud de supresión que afecte a backups requiere identificar todos los respaldos cifrados y su ciclo de vida; el actual borrado automático no abarca backups antiguos. No declarar resolución íntegra sin demostrarla. Los datos se minimizan en backend y no se introducen en GitHub issues/artifacts.

## Protocolo ante incidente
1. Detener exposición afectada y activar modo demo seguro sin IA ni memoria.
2. Revocar claves afectadas, caducar sesiones y preservar evidencias de seguridad sin copiar mensajes ni grabaciones de menores.
3. Determinar sistemas y datos afectados, consultar al responsable de tratamiento y asesoría jurídica y aplicar los plazos normativos correspondientes.
4. Informar a las personas afectadas y autoridad cuando la ley lo exija, por un canal oficial configurado por el responsable, sin inventar contactos.
5. Corregir causa raíz, añadir test de regresión y revisar ODD antes de volver a habilitar capacidades.

## Accesibilidad y revisión
Seguir la política de odd/quality/accessibility-review.md; todavía quedan auditoría WCAG 2.2 AA independiente, lectores de pantalla, zoom y dispositivos reales.

## Responsables de aprobación (sin suplantar decisiones)
El propietario del repositorio debe aprobar merges y releases. El responsable jurídico y especialista en menores debe validar bases legales y consentimiento. Expertos de audio y docencia deben validar voz, humor y currículo. Ninguno de esos controles queda aprobado automáticamente por CI.
