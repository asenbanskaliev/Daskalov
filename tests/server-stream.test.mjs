import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

test("LLM-001: endpoint NDJSON emite delta, sentence y complete con orden",async(t)=>{
 const app=createApp({dbPath:":memory:",streamLlm:async function*(){yield "¡En mis tiempos! ";yield "Hasta las moscas se ponían firmes.";}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const r=await fetch(base+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"Buenos días",remember:false})});
 assert.equal(r.status,200);assert.match(r.headers.get("content-type"),/ndjson/);
 const lines=(await r.text()).trim().split("\n").map(line=>JSON.parse(line));
 assert.equal(lines[0].type,"started");
 assert.ok(lines.some(x=>x.type==="delta"));
 assert.ok(lines.some(x=>x.type==="sentence"));
 assert.equal(lines.at(-1).type,"completed");
 assert.match(lines.at(-1).reply,/moscas/);
 assert.equal(new Set(lines.map(x=>x.requestId)).size,1);
 assert.deepEqual(lines.map(x=>x.sequence),lines.map((_,i)=>i));
});
test("LLM-007: error del upstream se devuelve como evento controlado y no bloquea el backend",async(t)=>{
 const app=createApp({dbPath:":memory:",streamLlm:async function*(){yield "Hola";throw new Error("upstream-private-secret");}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));app.close();});
 const host="http://127.0.0.1:"+app.server.address().port;
 const r=await fetch(host+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"cloud",model:"beam",text:"Hola",remember:false})});
 const lines=(await r.text()).trim().split("\n").map(JSON.parse);
 const error=lines.at(-1);
 assert.equal(error.type,"error");
 assert.ok(!error.error.includes("private-secret"));
 const health=await fetch(host+"/api/health");assert.equal(health.status,200);
});

test("LLM-003: al cancelar un stream antes del final no se conserva conversación",async(t)=>{
 const {getSession}=await import("../server/session.mjs");
 let started=false,aborted=false;
 const app=createApp({dbPath:":memory:",allowMemory:true,streamLlm:async function*({signal}){
  started=true;
  yield "¡Primera frase!";
  await Promise.race([
   new Promise(resolve=>signal.addEventListener("abort",resolve,{once:true})),
   new Promise(resolve=>setTimeout(resolve,1500))
  ]);
  aborted=signal.aborted;
  if(!signal.aborted)yield "No debería guardarse tras cancelar.";
 }});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const session=await fetch(base+"/api/session",{method:"POST"});
 const token=(await session.json()).csrfToken,cookie=session.headers.get("set-cookie").split(";")[0];
 const cancellation=new AbortController();
 const response=await fetch(base+"/api/chat/stream",{
  method:"POST",signal:cancellation.signal,
  headers:{"content-type":"application/json","x-daskalov-csrf":token,cookie},
  body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"Hola profesor",remember:true})
 });
 assert.equal(response.status,200);
 await response.body.getReader().read();
 cancellation.abort();
 for(let i=0;i<20&&!aborted;i++)await new Promise(resolve=>setTimeout(resolve,50));
 assert.equal(started,true);
 assert.equal(aborted,true);
 const player=getSession({headers:{cookie}},app.memory).playerId;
 assert.equal(app.memory.list(player).length,0);
});
