# Deployment and rollback: private or scripted demo only

Current state: this prototype has NOT passed legal, security, voice or teaching review.

## Safe container profile
- Dockerfile sets DASKALOV_SAFE_DEMO_ONLY=1. All API endpoints except /api/health are blocked; no Ollama/Whisper/Piper/memory/cloud usage.
- Frontend loads static assets; user selects Demo sin IA for interactive scripted responses. The UI should also auto-select it when health indicates demo-only.
- Never disable demo-only mode on an Internet-facing server before full review.

## Commands
- Private local: npm ci && npm run build && npm run verify:build && npm start
- Demo container: docker build -t profesor-daskalov:dev .
- Docker demonstration: docker run --rm -p 3000:3000 profesor-daskalov:dev
- Health verification: DASKALOV_SMOKE_URL=http://127.0.0.1:3000 npm run smoke:deploy

## Backup and rollback
- Stop application before restoring database backups; use openMemory(path).backup('backup.sqlite') to create a verified SQLite copy.
- Validate restored snapshot with PRAGMA quick_check and FTS checks before re-opening for real players.
- A previous release MUST NOT open a newer schema unless it has an approved down-migration.
- Do not store any player data, session cookies, audio, or secrets in GitHub artifacts.

## Not yet fulfilled
Public account authentication, verifiable parental consent, deletion from backups, model/voice licenses, independent security review, actual performance validation and production rollback drill.

## Encrypted backups (private administrator-only)
- Set `DASKALOV_BACKUP_KEY` to a 32-byte random key encoded with base64. Keep it in a credential vault, never GitHub.
- Set `DASKALOV_DB_PATH` to the path of the private database. Use `npm run backup:encrypted -- /secure/backups/daskalov-YYYYMMDD.enc` for authenticated AES-256-GCM backup.
- To restore, STOP Node first, select an empty/new target path (restore never overwrites), then run `npm run backup:restore -- /secure/backups/daskalov-YYYYMMDD.enc`.
- The restore verifies AES-GCM tag and SQLite quick_check before the app reads the database. Test the application schema version before starting older binaries.
- `npm run backup:prune -- /secure/backups` removes expired matching encrypted backups older than 30 days; back up the backup key separately and rotate according to policy.
- VACUUM INTO temporarily creates a plaintext SQLite snapshot in a private OS temporary directory; use full-disk encryption/RAM disk for the host. The tool erases the temporary directory after encryption, but OS snapshots and prior backups need independent deletion policy.
- Deleting a player DOES NOT retroactively erase them from previously stored encrypted backups. Before public use, implement data-subject erasure across the full backup lifecycle and review with counsel. S07.07/S10.07 remain partial.

## Contrato CI de imagen demo
`.github/workflows/container-demo.yml` construye y ejecuta la imagen en un job aislado sin secretos, comprueba salud y HTML y exige HTTP 403 para chat Cloud y sesión. Esto NO es una aprobación para publicar. El motor/modelo Piper, si se utilizan en entornos privados, requieren instalación, licencias y configuración fuera del contenedor demo. El Caddyfile es solo un ejemplo: para producción hace falta TLS, dominio y todas las autorizaciones externas.

## Drill automático previo a producción
`tests/staging-rollback-drill.test.mjs` realiza backup cifrado/restauración a SQLite nuevo y comprueba FTS, progreso, health y HTML. `npm run smoke:deploy` permite `DASKALOV_SMOKE_EXPECT_DEMO=1` para exigir denegación Cloud/memoria en un deployment demo. Esta prueba NO implica recuperación de una instalación real, ni sanea backups históricos de menores revocados. La revisión de restore debe realizarse con usuario autorizado y datos sintéticos.

## Evitar resurrección de recuerdos borrados en restauraciones

En staging privado configurar `DASKALOV_ERASURE_LEDGER_PATH` como ruta persistente **externa** al directorio y volumen de backups; configurar `DASKALOV_ERASURE_LEDGER_SECRET` con secreto de 32+ caracteres guardado en un vault; activar `DASKALOV_STRICT_PRIVACY_RESTORE=1`. Cada borrado crea primero un registro HMAC fsync y luego elimina el jugador, sin almacenar la identidad en texto claro en el ledger. Si el registro falla, la solicitud de borrado no se completa; investigar el incidente.

Durante `npm run backup:restore`, con strict=1 el ledger debe estar íntegro, o la restauración falla. Los registros se aplican a la base restaurada y se eliminan los recuerdos antiguos antes de empezar el servidor. Conservar la clave y el ledger mientras cualquiera de los respaldos históricos pueda restaurarse. Nunca respaldar solo la DB y perder el ledger.

**Limitación:** no elimina físicamente los bytes de backups históricos ya copiados fuera del control del servicio. Tampoco proporciona base legal de tratamiento, identidad tutelar ni consentimiento; S07.07 y S10.07 siguen pendientes hasta que se cubra toda la cadena de respaldos externos.

## Regla obligatoria en restauración con memoria habilitada
Con `DASKALOV_ALLOW_MEMORY=1`, el CLI de restauración impone verificación de `DASKALOV_ERASURE_LEDGER_PATH` y `DASKALOV_ERASURE_LEDGER_SECRET`, **aunque** `DASKALOV_STRICT_PRIVACY_RESTORE=0`. Si no existe el ledger o su HMAC no verifica, no se escribe el archivo SQLite de destino; configurar la ruta y secreto en el vault antes de restaurar. Al activar un ledger en el servidor, la clave debe tener al menos 32 caracteres: se rechaza el arranque si falta. El operador debe custodiar registro y clave fuera del directorio de backups. No utilizar `DASKALOV_ALLOW_MEMORY=0` para eludir los requisitos de recuperación de datos personales.

## Smoke ligado al commit exacto
En el release privado, establecer `DASKALOV_RELEASE_SHA` al SHA de 40 hex de GitHub antes de iniciar Node y establecer `DASKALOV_SMOKE_EXPECTED_SHA` al mismo valor al ejecutar `npm run smoke:deploy`; un SHA ausente o distinto bloqueará el smoke. La comprobación identifica una etiqueta declarada por el proceso y **no verifica por sí sola** la firma del artefacto, despliegue HTTPS o rollback físico.
