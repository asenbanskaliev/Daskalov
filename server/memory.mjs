import {migrateDatabase} from "./db-migrations.mjs";
import {redactSensitiveMemory} from "./character.mjs";
import {DatabaseSync} from "node:sqlite";
import {mkdirSync} from "node:fs";
import {dirname} from "node:path";
export function isPlayerId(value) {
 return typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function openMemory(fileName) {
 if(fileName!==":memory:")mkdirSync(dirname(fileName),{recursive:true});
 const db=new DatabaseSync(fileName);
 db.exec([
 "PRAGMA journal_mode=WAL;",
 "CREATE TABLE IF NOT EXISTS memories(id INTEGER PRIMARY KEY, player_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));",
 "CREATE INDEX IF NOT EXISTS memories_player_date ON memories(player_id,id DESC);",
 "CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(content,content='memories',content_rowid='id');",
 "CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN INSERT INTO memories_fts(rowid,content) VALUES (new.id,new.content); END;",
 "CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN INSERT INTO memories_fts(memories_fts,rowid,content) VALUES('delete',old.id,old.content); END;",
 "CREATE TABLE IF NOT EXISTS session_credentials(key_hash TEXT PRIMARY KEY, player_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT(datetime('now')), expires_at TEXT NOT NULL DEFAULT(datetime('now','+30 days')));",
 "CREATE INDEX IF NOT EXISTS idx_session_expiry ON session_credentials(expires_at);"
 ].join("\n"));
 migrateDatabase(db);
 const add=db.prepare("INSERT INTO memories(player_id,role,content) VALUES (?,?,?)");
 const recent=db.prepare("SELECT role,content,created_at FROM memories WHERE player_id=? ORDER BY id DESC LIMIT ?");
 const fts=db.prepare("SELECT m.role,m.content,m.created_at FROM memories_fts JOIN memories m ON m.id=memories_fts.rowid WHERE memories_fts MATCH ? AND m.player_id=? ORDER BY bm25(memories_fts) LIMIT ?");
 const del=db.prepare("DELETE FROM memories WHERE player_id=?");
 const insertCredential=db.prepare("INSERT INTO session_credentials(key_hash,player_id) VALUES (?,?)");
 const queryCredential=db.prepare("SELECT player_id FROM session_credentials WHERE key_hash=? AND expires_at>datetime('now')");
 const revokeCredential=db.prepare("DELETE FROM session_credentials WHERE key_hash=?");
 const insertPlayer=db.prepare("INSERT OR IGNORE INTO players(id) VALUES (?)");
 const all=db.prepare("SELECT id,role,content,created_at FROM memories WHERE player_id=? ORDER BY id");
 const modify=db.prepare("UPDATE memories SET content=? WHERE player_id=? AND id=?");
 const lessonUpsert=db.prepare("INSERT INTO lesson_progress(player_id,lesson_id,points) VALUES(?,?,?) ON CONFLICT(player_id,lesson_id) DO UPDATE SET points=MAX(points,excluded.points),updated_at=datetime('now')");
 const lessonList=db.prepare("SELECT lesson_id,points,updated_at FROM lesson_progress WHERE player_id=? ORDER BY lesson_id");
 const deletePlayerRow=db.prepare("DELETE FROM players WHERE id=?");
 const deleteCredentials=db.prepare("DELETE FROM session_credentials WHERE player_id=?");
 const privacy=db.prepare("SELECT memory_enabled,updated_at FROM privacy_preferences WHERE player_id=?");
 const privacyUpsert=db.prepare("INSERT INTO privacy_preferences(player_id,memory_enabled) VALUES(?,?) ON CONFLICT(player_id) DO UPDATE SET memory_enabled=excluded.memory_enabled,updated_at=datetime('now')");

 return {
  save(id,role,content){if(!isPlayerId(id)||!["user","assistant"].includes(role))throw new Error("Memoria inválida");insertPlayer.run(id);add.run(id,role,redactSensitiveMemory(content));},
  search(id,query,limit=5){
   if(!isPlayerId(id))return [];
   const size=Math.min(10,Math.max(1,Math.floor(limit)));
   const words=[...new Set(String(query).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[])].slice(0,6);
   const phrase=words.map(w=>'"'+w+'"').join(" OR ");
   let found=[];
   if(phrase){try{found=fts.all(phrase,id,size);}catch{found=[];}}
   const used=new Set(found.map(r=>r.role+":"+r.content));
   for(const row of recent.all(id,size)){if(!used.has(row.role+":"+row.content))found.push(row);if(found.length>=size)break;}
   return found.slice(0,size).map(row=>row.role+": "+row.content);
  },
  list(id){return isPlayerId(id)?recent.all(id,30):[];},
  deletePlayer(id){
   if(!isPlayerId(id))return;
   db.exec("BEGIN IMMEDIATE");
   try{
    del.run(id);
    deleteCredentials.run(id);
    deletePlayerRow.run(id);
    db.exec("COMMIT");
   }catch(error){db.exec("ROLLBACK");throw error;}
  },
  exportPlayer(id){
   if(!isPlayerId(id))return {memories:[],progress:[],preferences:null};
   db.prepare("INSERT INTO privacy_audit(action) VALUES ('export')").run();
   return {memories:all.all(id),progress:lessonList.all(id),preferences:privacy.get(id)||null};
  },
  correctMemory(id,memoryId,text){
   if(!isPlayerId(id)||!Number.isInteger(memoryId)||memoryId<1||typeof text!=="string"||!text.trim()||text.length>1500)return false;
   const result=modify.run(text,id,memoryId);
   if(result.changes)db.prepare("INSERT INTO privacy_audit(action) VALUES ('correct')").run();
   return result.changes>0;
  },
  recordProgress(id,lessonId,points){
   if(!isPlayerId(id)||!["math","language","history"].includes(lessonId)||points!==10)throw Error("Progreso inválido.");
   insertPlayer.run(id);lessonUpsert.run(id,lessonId,points);
  },
  getProgress(id){return isPlayerId(id)?lessonList.all(id):[];},
  setMemoryConsent(id,enabled){
   if(!isPlayerId(id))throw Error("Jugador inválido.");
   insertPlayer.run(id);privacyUpsert.run(id,enabled?1:0);
  },
  schemaVersion(){return db.prepare("PRAGMA user_version").get().user_version;},
  integrity(){return {quickCheck:db.prepare("PRAGMA quick_check").get().quick_check,ftsCount:db.prepare("SELECT COUNT(*) AS n FROM memories_fts").get().n};},
  backup(path){
   if(typeof path!=="string"||!path.endsWith(".sqlite"))throw Error("Ruta de backup inválida.");
   db.prepare("VACUUM INTO ?").run(path);
   return path;
  },
  createSession(hash,id){if(!/^[a-f0-9]{64}$/.test(hash)||!isPlayerId(id))throw new Error("Credential format invalid");insertPlayer.run(id);insertCredential.run(hash,id);},
  resolveSession(hash){if(typeof hash!=="string"||!/^[a-f0-9]{64}$/.test(hash))return null;return queryCredential.get(hash)?.player_id||null;},
  revokeSession(hash){if(typeof hash==="string"&&/^[a-f0-9]{64}$/.test(hash))revokeCredential.run(hash);},
  cleanup(){db.exec("DELETE FROM memories WHERE created_at < datetime('now','-30 days'); DELETE FROM session_credentials WHERE expires_at < datetime('now')");},
  close(){db.close();}
 };
}
