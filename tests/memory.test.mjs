import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {openMemory,isPlayerId} from "../server/memory.mjs";
test("SQLite FTS5, segregación por alumno y borrado",()=>{
 const db=openMemory(":memory:");
 try{
  const a=randomUUID(),b=randomUUID();
  assert.equal(isPlayerId(a),true);assert.equal(isPlayerId("inseguro"),false);
  db.save(a,"user","Me encantan las matemáticas y la geometría");
  db.save(a,"assistant","¡En mis tiempos sumábamos ladrillos!");
  db.save(b,"user","Me gusta estudiar historia");
  assert.ok(db.search(a,"matemáticas").some(x=>x.includes("geometría")));
  assert.ok(db.search(b,"matemáticas").every(x=>!x.includes("geometría")));
  db.deletePlayer(a);assert.equal(db.list(a).length,0);assert.equal(db.list(b).length,1);
 }finally{db.close();}
});
