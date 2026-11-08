import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {openMemory} from "../server/memory.mjs";
test("MEM-004: FTS5 limits by player, removes duplicate memories and boosts relevant preferences",()=>{
 const db=openMemory(":memory:");
 try{
  const a=randomUUID(),b=randomUUID();
  assert.equal(db.save(a,"user","Mi objetivo es aprender matemáticas"),true);
  assert.equal(db.save(a,"user","Mi objetivo es aprender matemáticas"),false);
  db.save(a,"user","Hoy me apetece descansar");
  db.save(a,"assistant","La pizarra es verde");
  db.save(b,"user","Me gustan las matemáticas y la geometría");
  assert.equal(db.exportPlayer(a).memories.length,3);
  const result=db.search(a,"objetivo matemáticas",3);
  assert.match(result[0],/Mi objetivo es aprender matemáticas/);
  assert.ok(result.every(row=>!row.includes("geometría")));
  assert.equal(db.search(b,"matemáticas").some(row=>row.includes("geometría")),true);
  assert.equal(db.integrity().quickCheck,"ok");
 }finally{db.close();}
});
test("MEM-004: no FTS match still falls back to recent content; every result deduplicated",()=>{
 const db=openMemory(":memory:");
 try{
  const id=randomUUID();
  db.save(id,"user","Una anécdota del colegio");
  db.save(id,"assistant","La tiza habla por las noches");
  const list=db.search(id,"extraterrestre",8);
  assert.equal(list.length,2);
  assert.equal(new Set(list).size,2);
 }finally{db.close();}
});
