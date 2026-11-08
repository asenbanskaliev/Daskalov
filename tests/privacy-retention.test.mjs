import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {openMemory} from "../server/memory.mjs";
test("MEM-007/009: edits and originals redact email, phone and identity numbers",()=>{
 const memory=openMemory(":memory:"),id=randomUUID();
 try{
  memory.save(id,"user","Mi email es menor@example.com y móvil 612345678");
  const row=memory.exportPlayer(id).memories[0];
  assert.ok(!row.content.includes("menor@example.com"));
  assert.equal(memory.correctMemory(id,row.id,"Nuevo correo otra@example.com DNI 12345678Z"),true);
  const revised=memory.exportPlayer(id).memories[0].content;
  assert.doesNotMatch(revised,/otra@example.com|12345678Z/);
  assert.equal(memory.integrity().quickCheck,"ok");
 }finally{memory.close();}
});
test("MEM-008: max 200 rows per player, plus 30d memory and 180d progress expiry",()=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-ttl-")),path=join(dir,"db.sqlite"),id=randomUUID();
 try{
  const db=openMemory(path);
  for(let i=0;i<230;i++)db.save(id,"user","Recuerdo "+i);
  assert.equal(db.exportPlayer(id).memories.length,200);
  assert.equal(db.search(id,"Recuerdo").length>0,true);
  db.recordProgress(id,"math",10);
  const external=new DatabaseSync(path);
  external.exec("UPDATE memories SET created_at='2001-01-01'; UPDATE lesson_progress SET updated_at='2001-01-01';");
  external.close();
  // Expiration must be enforced on all read paths, not only on startup pruning.
  assert.deepEqual(db.search(id,"Recuerdo"),[]);
  assert.equal(db.exportPlayer(id).memories.length,0);
  assert.deepEqual(db.getProgress(id),[]);
  db.cleanup();
  assert.equal(db.exportPlayer(id).memories.length,0);
  assert.deepEqual(db.getProgress(id),[]);
  assert.equal(db.integrity().quickCheck,"ok");
  db.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
