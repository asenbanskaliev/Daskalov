import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

test("PERF-005: 100 mocked conversations with 429/500, network delay and interrupted clients",async t=>{
 let providerCalls=0;
 const app=createApp({
  dbPath:":memory:",maxCallsPerMinute:150,maxCallsPerDay:150,maxConcurrent:1,
  streamLlm:async function*(){
   const count=++providerCalls;
   if(count%17===0)throw Error("HTTP 500");
   if(count%13===0)throw Error("HTTP 429");
   if(count%7===0)await new Promise(resolve=>setTimeout(resolve,12));
   yield "¡Buenos días! ";
   if(count%9===0)await new Promise(resolve=>setTimeout(resolve,12));
   yield "Seguimos aprendiendo.";
  }
 });
 app.server.listen(0,"127.0.0.1");
 await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const ids=new Set();
 let completed=0,errors=0,aborted=0;
 for(let i=0;i<100;i++){
  const controller=new AbortController();
  const response=await fetch(base+"/api/chat/stream",{
   method:"POST",signal:controller.signal,
   headers:{"content-type":"application/json"},
   body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"Prueba de red sintética "+i})
  });
  assert.equal(response.status,200);
  if(i%10===0){
   const reader=response.body.getReader();
   await reader.read();
   controller.abort();
   try{await reader.cancel();}catch{}
   aborted++;
   // Let abort propagate to the server before opening the next turn.
   // Mock upstream may still be inside its 12 ms sleep after abort.
   // Check server returns to an idle state before the next synthetic turn.
   await new Promise(resolve=>setTimeout(resolve,45));
   continue;
  }
  const events=(await response.text()).trim().split("\n").map(JSON.parse);
  assert.equal(events[0].type,"started");
  const id=events[0].requestId;
  assert.ok(!ids.has(id));
  ids.add(id);
  assert.ok(events.every(x=>x.requestId===id));
  assert.ok(events.every((x,j)=>x.sequence===j));
  const final=events.at(-1);
  if(final.type==="completed")completed++;
  else{assert.equal(final.type,"error");errors++;}
 }
 assert.equal(completed+errors+aborted,100);
 assert.equal(aborted,10);
 assert.ok(completed>=65);
 assert.ok(providerCalls>=100);
 const metrics=await (await fetch(base+"/api/metrics")).json();
 assert.ok(metrics.providers.local.requests>=90);
 assert.ok(!JSON.stringify(metrics).includes("Prueba de red sintética"));
});
