import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {openMemory} from "../server/memory.mjs";

test("MEM-001/MEM-002: schema v2, FTS5 y progreso aislado",()=>{
 const db=openMemory(":memory:");
 try{
  assert.equal(db.schemaVersion(),2);
  const id=randomUUID();
  db.save(id,"user","Me gustan los triángulos");
  db.recordProgress(id,"math",10);
  db.setMemoryConsent(id,true);
  assert.deepEqual(db.getProgress(id).map(x=>x.lesson_id),["math"]);
  assert.ok(db.search(id,"triángulos").some(x=>x.includes("triángulos")));
  assert.equal(db.integrity().quickCheck,"ok");
  assert.equal(db.exportPlayer(id).memories.length,1);
  db.deletePlayer(id);
  assert.equal(db.exportPlayer(id).memories.length,0);
  assert.equal(db.getProgress(id).length,0);
 }finally{db.close();}
});
test("MEM-007: solo el propietario corrige y FTS5 se reindexa",()=>{
 const db=openMemory(":memory:");
 try{
  const a=randomUUID(),b=randomUUID();
  db.save(a,"user","Me gustan los números");
  const id=db.exportPlayer(a).memories[0].id;
  assert.equal(db.correctMemory(b,id,"Acceso ilegal"),false);
  assert.equal(db.correctMemory(a,id,"Ahora prefiero geometría"),true);
  assert.ok(db.search(a,"geometría").some(x=>x.includes("geometría")));
  assert.ok(db.search(b,"geometría").every(x=>!x.includes("geometría")));
 }finally{db.close();}
});
test("MEM-001: respaldo VACUUM INTO restaura datos y su integridad",()=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-sql-"));
 const path=join(dir,"original.sqlite"),backup=join(dir,"backup.sqlite");
 const id=randomUUID();
 try{
  const db=openMemory(path);
  db.save(id,"user","Ayer estudié la historia de Europa");
  db.backup(backup);
  db.close();
  const restored=openMemory(backup);
  try{
   assert.equal(restored.schemaVersion(),2);
   assert.ok(restored.search(id,"historia").length>0);
   assert.equal(restored.integrity().quickCheck,"ok");
  }finally{restored.close();}
 }finally{rmSync(dir,{recursive:true,force:true});}
});
