# Atomic SQLite quotas and leases (private staging only)

Opt-in with DASKALOV_DISTRIBUTED_LIMIT=1 and a stable 24+ character DASKALOV_LEDGER_SECRET. All replicas MUST share the same SQLite volume. Distributed usage is atomic through BEGIN IMMEDIATE and guarded by 5-second busy timeout.

Store only HMAC-SHA256 hashed request identities and global Cloud scope, never raw IPs or conversations. Each request reserves input plus an upper-bound output estimate. Per-day call and token limits, global Cloud call cap and per-user concurrent lease protect against unexpected spending and abuse. Leases expire after 90 seconds to release a crashed process.

Token consumption is a conservative reservation, NOT actual provider billing. The local single-process limiter remains active; both apply and the stricter limit wins. SQLite replicas on different volumes do NOT form a distributed cluster.

Public deployment is still BLOCKED: anonymous IPs are not true identity, distributed authentication, secure reverse proxy, formal consent for minors, per-model pricing, security audits and a proper production datastore remain necessary.

Tests: tests/usage-ledger.test.mjs and integration/security tests. No Cloud or network calls are made by the quota ledger.
