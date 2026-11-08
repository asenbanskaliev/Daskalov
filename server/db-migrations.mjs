export const DB_SCHEMA_VERSION=3;
/** Additive SQLite migrations; legacy memories and FTS remain intact. */
export function migrateDatabase(db){
 db.exec("PRAGMA foreign_keys=ON");
 const version=db.prepare("PRAGMA user_version").get().user_version;
 if(version>DB_SCHEMA_VERSION)throw Error("SQLite schema newer than this application.");
 if(version>=DB_SCHEMA_VERSION)return version;
 db.exec("BEGIN IMMEDIATE");
 try{
  db.exec([
   "CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT(datetime('now')));",
   "CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT(datetime('now')));",
   "CREATE TABLE IF NOT EXISTS privacy_preferences(player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE, memory_enabled INTEGER NOT NULL DEFAULT 0 CHECK(memory_enabled IN(0,1)), updated_at TEXT NOT NULL DEFAULT(datetime('now')));",
   "CREATE TABLE IF NOT EXISTS lesson_progress(player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL, points INTEGER NOT NULL CHECK(points BETWEEN 0 AND 10), updated_at TEXT NOT NULL DEFAULT(datetime('now')), PRIMARY KEY(player_id,lesson_id));",
   "CREATE TABLE IF NOT EXISTS fictional_lore(key TEXT PRIMARY KEY, body TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);",
   "CREATE TABLE IF NOT EXISTS privacy_audit(id INTEGER PRIMARY KEY, action TEXT NOT NULL CHECK(action IN('export','correct','delete')), at TEXT NOT NULL DEFAULT(datetime('now')));",
   "INSERT OR IGNORE INTO players(id) SELECT DISTINCT player_id FROM session_credentials;",
   "INSERT OR IGNORE INTO players(id) SELECT DISTINCT player_id FROM memories;",
   "CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN INSERT INTO memories_fts(memories_fts,rowid,content) VALUES('delete',old.id,old.content); INSERT INTO memories_fts(rowid,content) VALUES(new.id,new.content); END;",
   "INSERT OR IGNORE INTO schema_migrations(version) VALUES(1);",
   "INSERT OR IGNORE INTO schema_migrations(version) VALUES(2);",
   "CREATE TABLE IF NOT EXISTS memory_embeddings(memory_id INTEGER PRIMARY KEY REFERENCES memories(id) ON DELETE CASCADE, player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE, model TEXT NOT NULL, dims INTEGER NOT NULL CHECK(dims BETWEEN 2 AND 2048), vector BLOB NOT NULL, checksum TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT(datetime('now')));",
   "CREATE INDEX IF NOT EXISTS memory_embeddings_player_model ON memory_embeddings(player_id,model);",
   "INSERT OR IGNORE INTO schema_migrations(version) VALUES(3);",
   "PRAGMA user_version=3;"
  ].join("\n"));
  db.exec("COMMIT");
 }catch(error){db.exec("ROLLBACK");throw error;}
 return DB_SCHEMA_VERSION;
}
