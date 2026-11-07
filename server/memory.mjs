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
 "CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN INSERT INTO memories_fts(memories_fts,rowid,content) VALUES('delete',old.id,old.content); END;"
 ].join("\n"));
 const add=db.prepare("INSERT INTO memories(player_id,role,content) VALUES (?,?,?)");
 const recent=db.prepare("SELECT role,content,created_at FROM memories WHERE player_id=? ORDER BY id DESC LIMIT ?");
 const fts=db.prepare("SELECT m.role,m.content,m.created_at FROM memories_fts JOIN memories m ON m.id=memories_fts.rowid WHERE memories_fts MATCH ? AND m.player_id=? ORDER BY bm25(memories_fts) LIMIT ?");
 const del=db.prepare("DELETE FROM memories WHERE player_id=?");
 return {
  save(id,role,content){if(!isPlayerId(id)||!["user","assistant"].includes(role))throw new Error("Memoria inválida");add.run(id,role,String(content).slice(0,1500));},
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
  deletePlayer(id){if(isPlayerId(id))del.run(id);},
  cleanup(){db.exec("DELETE FROM memories WHERE created_at < datetime('now','-30 days')");},
  close(){db.close();}
 };
}
