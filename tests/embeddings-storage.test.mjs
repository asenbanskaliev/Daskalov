import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {openMemory} from "../server/memory.mjs";
test("MEM-006: local embeddings are isolated by player and cosine retrieves the best memory",async()=>{
 const db=openMemory(":memory:");
 try{
  const a=randomUUID(),b=randomUUID(),model="embeddinggemma";
  db.save(a,"user","Me gustan las matemáticas");
  db.save(a,"user","El profesor enseñó geografía");
  db.save(b,"user","Datos privados de otro alumno");
  const rows=db.exportPlayer(a).memories;
  for(const row of rows){
   const v=row.content.includes("matemáticas")?[1,0,0]:[0,1,0];
   assert.equal(db.putEmbedding(a,row.id,model,v),true);
  }
  const recalled=db.searchHybrid(a,"¿Qué me gusta?",[1,0,0],model,2);
  assert.match(recalled[0],/matemáticas/);
  assert.ok(recalled.every(x=>!x.includes("otro alumno")));
  assert.deepEqual(db.searchHybrid(b,"¿Qué me gusta?",[1,0,0],model,5),db.search(b,"¿Qué me gusta?",5));
  assert.throws(()=>db.putEmbedding(b,rows[0].id,model,[1,0,0]),/autorizado/);
 }finally{db.close();}
});
test("MEM-006: changed memory invalidates checksum and is safely reindexed; deleting cleans vectors",async()=>{
 const db=openMemory(":memory:");
 try{
  const a=randomUUID(),model="embeddinggemma";
  db.save(a,"user","Ahora me gusta estudiar historia");
  const id=db.exportPlayer(a).memories[0].id;
  assert.deepEqual(db.pendingEmbeddings(a,model).map(r=>r.id),[id]);
  assert.equal((await db.reindexPlayer(a,model,async()=>[1,.1,0])).indexed,1);
  assert.deepEqual(db.pendingEmbeddings(a,model),[]);
  assert.equal(db.correctMemory(a,id,"Prefiero estudiar geometría"),true);
  assert.equal(db.pendingEmbeddings(a,model).length,1);
  assert.equal((await db.reindexPlayer(a,model,async()=>[0,1,0])).indexed,1);
  assert.match(db.searchHybrid(a,"geometría",[0,1,0],model,1)[0],/geometría/);
  db.deletePlayer(a);
  assert.deepEqual(db.searchHybrid(a,"geometría",[0,1,0],model,3),[]);
 }finally{db.close();}
});
