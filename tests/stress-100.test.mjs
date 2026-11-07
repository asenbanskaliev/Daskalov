import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
test("PERF-005: 100 conversaciones sintéticas; cancelaciones y errores controlados sin fuga Cloud",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",maxCallsPerMinute:150,maxCallsPerDay:150,streamLlm:async function*(){
  calls++;
  if(calls%11===0)throw Error("HTTP 503");
  yield "¡Profesor! ";yield "Las matemáticas son útiles.";
 }});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 let success=0,error=0;
 const requestIds=new Set();
 for(let i=0;i<100;i++){
  const r=await fetch(base+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"Pregunta sintética "+i})});
  assert.equal(r.status,200);
  const events=(await r.text()).trim().split("\n").map(JSON.parse);
  assert.equal(events[0].type,"started");
  assert.equal(new Set(events.map(e=>e.requestId)).size,1);
  assert.ok(!requestIds.has(events[0].requestId));
  requestIds.add(events[0].requestId);
  if(events.at(-1).type==="completed")success++;
  else{assert.equal(events.at(-1).type,"error");error++;}
 }
 assert.equal(success+error,100);
 assert.ok(success>=80);
 const metrics=await (await fetch(base+"/api/metrics")).json();
 assert.equal(metrics.providers.local.requests,100);
 assert.ok(!JSON.stringify(metrics).includes("Pregunta sintética"));
});
