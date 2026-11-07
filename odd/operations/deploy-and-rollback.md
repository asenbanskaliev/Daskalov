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
