# Datos privados: límites técnicos y bloqueos legales

Retención técnica (no equivale a autorización legal): texto de recuerdo hasta 1500 caracteres, máximo 200 recuerdos por jugador, caducidad 30 días; progreso por materia con caducidad 180 días; sesiones hasta 30 días; auditoría anónima de exportación/corrección hasta 30 días. El audio nunca se guarda en SQLite ni en logs.

Al guardar y corregir recuerdos se redactan patrones de correo electrónico, móvil español y documento de identidad; esta regla no detecta todos los datos personales y no sustituye revisión de privacidad.

La eliminación del jugador borra recuerdos, progreso, preferencias y sesiones en una transacción; la copia de seguridad previamente creada no se elimina de forma automática. Implantar antes del uso público un ciclo de vida de backups cifrados con expiración, borrado y evaluación legal.

El consentimiento de memoria en la interfaz es opcional, pero sigue pendiente validar base jurídica y, cuando proceda, permiso del tutor. Por este motivo MEM-READY y SEC-PUBLIC siguen bloqueados.
