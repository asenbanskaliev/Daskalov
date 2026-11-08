import {migrateDatabase} from "./db-migrations.mjs";
import {redactSensitiveMemory} from "./character.mjs";
import {DatabaseSync} from "node:sqlite";
import {createHash} from "node:crypto";
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
 const existing=db.prepare("SELECT id FROM memories WHERE player_id=? AND role=? AND content=? AND created_at>=datetime('now','-1 day') LIMIT 1");
 const capMemories=db.prepare("DELETE FROM memories WHERE player_id=? AND id NOT IN (SELECT id FROM memories WHERE player_id=? ORDER BY id DESC LIMIT 200)");
 const recent=db.prepare("SELECT role,content,created_at FROM memories WHERE player_id=? AND created_at>=datetime('now','-30 days') ORDER BY id DESC LIMIT ?");
 const fts=db.prepare("SELECT m.role,m.content,m.created_at,bm25(memories_fts) AS fts_score FROM memories_fts JOIN memories m ON m.id=memories_fts.rowid WHERE memories_fts MATCH ? AND m.player_id=? AND m.created_at>=datetime('now','-30 days') ORDER BY bm25(memories_fts) LIMIT ?");
 const del=db.prepare("DELETE FROM memories WHERE player_id=?");
 const insertCredential=db.prepare("INSERT INTO session_credentials(key_hash,player_id) VALUES (?,?)");
 const queryCredential=db.prepare("SELECT player_id FROM session_credentials WHERE key_hash=? AND expires_at>datetime('now')");
 const revokeCredential=db.prepare("DELETE FROM session_credentials WHERE key_hash=?");
 const insertPlayer=db.prepare("INSERT OR IGNORE INTO players(id) VALUES (?)");
 const all=db.prepare("SELECT id,role,content,created_at FROM memories WHERE player_id=? AND created_at>=datetime('now','-30 days') ORDER BY id");
 const modify=db.prepare("UPDATE memories SET content=? WHERE player_id=? AND id=?");
 const lessonUpsert=db.prepare("INSERT INTO lesson_progress(player_id,lesson_id,points) VALUES(?,?,?) ON CONFLICT(player_id,lesson_id) DO UPDATE SET points=MAX(points,excluded.points),updated_at=datetime('now')");
 const lessonList=db.prepare("SELECT lesson_id,points,updated_at FROM lesson_progress WHERE player_id=? AND updated_at>=datetime('now','-180 days') ORDER BY lesson_id");
 const deletePlayerRow=db.prepare("DELETE FROM players WHERE id=?");
 const deleteCredentials=db.prepare("DELETE FROM session_credentials WHERE player_id=?");
 const privacy=db.prepare("SELECT memory_enabled,updated_at FROM privacy_preferences WHERE player_id=?");
 const privacyUpsert=db.prepare("INSERT INTO privacy_preferences(player_id,memory_enabled) VALUES(?,?) ON CONFLICT(player_id) DO UPDATE SET memory_enabled=excluded.memory_enabled,updated_at=datetime('now')");
 const embedLookup=db.prepare("SELECT model,checksum FROM memory_embeddings WHERE memory_id=? AND player_id=?");
 const embedDoc=db.prepare("SELECT id,role,content FROM memories WHERE player_id=? AND id=? AND created_at>=datetime('now','-30 days')");
 const embedDocuments=db.prepare("SELECT id,role,content FROM memories WHERE player_id=? AND created_at>=datetime('now','-30 days') ORDER BY id DESC LIMIT 200");
 const embedUpsert=db.prepare("INSERT INTO memory_embeddings(memory_id,player_id,model,dims,vector,checksum) VALUES(?,?,?,?,?,?) ON CONFLICT(memory_id) DO UPDATE SET model=excluded.model,dims=excluded.dims,vector=excluded.vector,checksum=excluded.checksum,updated_at=datetime('now')");
 const indexed=db.prepare("SELECT m.role,m.content,e.dims,e.vector,e.checksum FROM memory_embeddings e JOIN memories m ON m.id=e.memory_id WHERE e.player_id=? AND m.player_id=? AND e.model=? AND m.created_at>=datetime('now','-30 days') LIMIT 200");
 const digest=text=>createHash("sha256").update(text,"utf8").digest("hex");
 const validVector=v=>Array.isArray(v)&&v.length>=2&&v.length<=2048&&v.every(n=>typeof n==="number"&&Number.isFinite(n));
 const normalizedModel=m=>typeof m==="string"&&/^[a-zA-Z0-9._:/-]{1,100}$/.test(m);


 return {
  save(id,role,content){
   if(!isPlayerId(id)||!["user","assistant"].includes(role))throw new Error("Memoria inválida");
   const safe=redactSensitiveMemory(content);
   insertPlayer.run(id);
   if(existing.get(id,role,safe))return false;
   add.run(id,role,safe);capMemories.run(id,id);
   return true;
  },
  search(id,query,limit=5){
   if(!isPlayerId(id))return [];
   const size=Math.min(10,Math.max(1,Math.floor(Number(limit)||5)));
   const words=[...new Set(String(query).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[])].slice(0,6);
   const phrase=words.map(w=>'"'+w+'"').join(" OR ");
   const candidates=[];
   if(phrase){
    try{candidates.push(...fts.all(phrase,id,Math.min(50,size*5)));}catch{}
   }
   candidates.push(...recent.all(id,Math.min(50,size*5)));
   const seen=new Set(),now=Date.now();
   const ranked=[];
   for(const row of candidates){
    const key=row.role+":"+row.content;
    if(seen.has(key))continue;
    seen.add(key);
    const text=row.content.toLocaleLowerCase("es");
    const relevance=words.reduce((sum,word)=>sum+(text.includes(word)?1:0),0);
    const important=/me gusta|prefiero|mi objetivo|quiero aprender|me cuesta|recuerda|dificultad/.test(text);
    const timestamp=Date.parse(String(row.created_at).replace(" ","T")+"Z");
    const ageDays=Number.isFinite(timestamp)?Math.max(0,(now-timestamp)/86400000):30;
    const score=relevance*100+(important?16:0)+(row.role==="user"?3:0)+Math.max(0,30-ageDays)*.05;
    ranked.push({score,row});
   }
   ranked.sort((a,b)=>b.score-a.score);
   return ranked.slice(0,size).map(item=>item.row.role+": "+item.row.content);
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
   const result=modify.run(redactSensitiveMemory(text),id,memoryId);
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
  pendingEmbeddings(id,model,limit=10){
   if(!isPlayerId(id)||!normalizedModel(model))return [];
   return embedDocuments.all(id).filter(row=>{
    const saved=embedLookup.get(row.id,id);
    return !saved||saved.model!==model||saved.checksum!==digest(row.content);
   }).slice(0,Math.min(25,Math.max(1,Math.floor(Number(limit)||10))));
  },
  putEmbedding(id,memoryId,model,vector){
   if(!isPlayerId(id)||!Number.isInteger(memoryId)||!normalizedModel(model)||!validVector(vector))throw Error("Embedding inválido.");
   const doc=embedDoc.get(id,memoryId);
   if(!doc)throw Error("No existe recuerdo autorizado para el vector.");
   const bytes=Buffer.alloc(vector.length*4);
   vector.forEach((n,i)=>bytes.writeFloatLE(n,i*4));
   embedUpsert.run(memoryId,id,model,vector.length,bytes,digest(doc.content));
   return true;
  },
  searchHybrid(id,query,vector,model,limit=5){
   if(!isPlayerId(id))return [];
   const size=Math.min(10,Math.max(1,Math.floor(Number(limit)||5)));
   const lexical=this.search(id,query,size);
   if(!normalizedModel(model)||!validVector(vector))return lexical;
   const queryNorm=Math.hypot(...vector);
   if(queryNorm===0)return lexical;
   const matches=[];
   for(const row of indexed.all(id,id,model)){
    if(row.dims!==vector.length||row.checksum!==digest(row.content))continue;
    const data=Buffer.from(row.vector);
    if(data.length!==row.dims*4)continue;
    let dot=0,norm2=0,valid=true;
    for(let i=0;i<row.dims;i++){
     const value=data.readFloatLE(i*4);
     if(!Number.isFinite(value)){valid=false;break;}
     dot+=value*vector[i];norm2+=value*value;
    }
    if(!valid||norm2===0)continue;
    const cosine=dot/(Math.sqrt(norm2)*queryNorm);
    if(cosine>=.2)matches.push({text:row.role+": "+row.content,score:cosine});
   }
   matches.sort((a,b)=>b.score-a.score);
   const result=[],seen=new Set();
   function add(value){if(value&&!seen.has(value)&&result.length<size){seen.add(value);result.push(value);}}
   for(let i=0;i<Math.max(matches.length,lexical.length);i++){add(matches[i]?.text);add(lexical[i]);}
   return result;
  },
  async reindexPlayer(id,model,embedFn,limit=10){
   if(typeof embedFn!=="function")throw Error("Proveedor de embeddings requerido.");
   let count=0;
   for(const doc of this.pendingEmbeddings(id,model,limit)){
    const vector=await embedFn({input:doc.content,model});
    this.putEmbedding(id,doc.id,model,vector);
    count++;
   }
   return {indexed:count,remaining:this.pendingEmbeddings(id,model,1).length>0};
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
  cleanup(){db.exec("DELETE FROM memories WHERE created_at < datetime('now','-30 days'); DELETE FROM lesson_progress WHERE updated_at < datetime('now','-180 days'); DELETE FROM session_credentials WHERE expires_at < datetime('now'); DELETE FROM privacy_audit WHERE at < datetime('now','-30 days');");},
  close(){db.close();}
 };
}
