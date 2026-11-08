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
