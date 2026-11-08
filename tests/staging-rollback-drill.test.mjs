import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openMemory} from "../server/memory.mjs";
import {createEncryptedBackup,restoreEncryptedBackup} from "../server/secure-backup.mjs";
import {createApp} from "../server/main.mjs";

test("REL-005: staging rollback restores encrypted SQLite snapshot with FTS and health",async t=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-staging-"));
 const initial=join(dir,"current.sqlite"),restored=join(dir,"previous.sqlite"),backup=join(dir,"snapshot.enc");
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const key=randomBytes(32).toString("base64"),playerId=randomUUID();
 const db=openMemory(initial);
 db.save(playerId,"user","Prefiero matemáticas y geometría");
 db.recordProgress(playerId,"math",10);
 await createEncryptedBackup({memory:db,destination:backup,keyBase64:key});
 db.save(playerId,"user","Nueva versión incompatible");
 assert.ok(db.search(playerId,"incompatible").length>0);
 db.close();

 await restoreEncryptedBackup({source:backup,target:restored,keyBase64:key});
 const rollback=openMemory(restored);
 try{
  assert.equal(rollback.integrity().quickCheck,"ok");
  assert.ok(rollback.search(playerId,"geometría").length>0);
  // search() deliberately falls back to recent memories; export is the exact dataset assertion.
  assert.ok(rollback.exportPlayer(playerId).memories.every(row=>!row.content.includes("incompatible")));
  assert.equal(rollback.getProgress(playerId)[0].lesson_id,"math");
 }finally{rollback.close();}

 const app=createApp({dbPath:restored,allowMemory:false});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const origin="http://127.0.0.1:"+app.server.address().port;
 const health=await fetch(origin+"/api/health");
 assert.equal(health.status,200);
 assert.equal((await health.json()).ok,true);
 assert.match(health.headers.get("content-security-policy")||"",/script-src 'self'/);
 const index=await fetch(origin+"/");
 assert.equal(index.status,200);
 assert.match(await index.text(),/Profesor Daskalov/);
});
