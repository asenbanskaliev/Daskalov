import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
import {openMemory} from "../server/memory.mjs";
test("MEM-010: 20 players on 2 SQLite handles preserve owner scoping and FTS5 integrity",async()=>{
 const folder=mkdtempSync(join(tmpdir(),"daskalov-wal-")),path=join(folder,"memory.sqlite");
 const dbA=openMemory(path),dbB=openMemory(path);
 const ids=Array.from({length:20},()=>randomUUID());
 try{
  await Promise.all(ids.map((id,i)=>Promise.resolve().then(()=>{
   const db=i%2?dbA:dbB;
   db.save(id,"user","Mi lección número "+i+" es privada y contiene pizarra.");
   db.recordProgress(id,"math",10);
  })));
  for(const [i,id] of ids.entries()){
   const db=i%2?dbB:dbA;
   const records=db.exportPlayer(id).memories;
   assert.equal(records.length,1);
   assert.ok(records[0].content.includes("número "+i));
   assert.equal(db.getProgress(id).length,1);
   const matched=db.search(id,"pizarra",10);
   assert.equal(matched.length,1);
   assert.ok(matched.every(v=>v.includes("número "+i)));
  }
  assert.equal(dbA.integrity().quickCheck,"ok");
  assert.equal(dbB.integrity().quickCheck,"ok");
 }finally{dbA.close();dbB.close();rmSync(folder,{recursive:true,force:true});}
});
test("MEM-010: simulated crash before COMMIT rolls back writes, preserves committed rows",()=>{
 const folder=mkdtempSync(join(tmpdir(),"daskalov-crash-")),path=join(folder,"memory.sqlite"),id=randomUUID();
 try{
  const one=openMemory(path);
  one.save(id,"user","Recuerdo confirmado");
  one.close();
  const raw=new DatabaseSync(path);
  raw.exec("PRAGMA journal_mode=WAL; BEGIN IMMEDIATE;");
  raw.prepare("INSERT INTO memories(player_id,role,content) VALUES(?,?,?)").run(id,"user","Recuerdo nunca confirmado");
  raw.exec("ROLLBACK;");
  raw.close();
  const recovered=openMemory(path);
  try{
   assert.equal(recovered.integrity().quickCheck,"ok");
   const records=recovered.exportPlayer(id).memories;
   assert.equal(records.length,1);
   assert.equal(records[0].content,"Recuerdo confirmado");
   assert.ok(recovered.search(id,"confirmado")[0].includes("confirmado"));
  }finally{recovered.close();}
 }finally{rmSync(folder,{recursive:true,force:true});}
});
