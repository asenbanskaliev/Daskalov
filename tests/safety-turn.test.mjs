import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
test("CHAR-005: usuario acosado obtiene apoyo determinista sin consumir Ollama",async t=>{
 let called=0;
 const app=createApp({dbPath:":memory:",allowMemory:true,llm:async()=>{called++;return "error";},streamLlm:async function*(){called++;yield "error";}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 for(const path of ["/api/chat","/api/chat/stream"]){
  const r=await fetch(base+path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"cloud",model:"beam",text:"Me hacen bullying en clase"})});
  assert.equal(r.status,200);
  const text=await r.text();
  assert.match(text,/adulto de confianza/);
 }
 assert.equal(called,0);
});
