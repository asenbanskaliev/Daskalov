import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

test("SEC-005: 100 Cloud requests con host no autorizado generan 0 llamadas LLM",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",llm:async()=>{calls++;return "¡Hola!"},maxCloudCallsPerDay:3,maxCallsPerDay:110,maxCallsPerMinute:110});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const url="http://127.0.0.1:"+app.server.address().port+"/api/chat";
 for(let i=0;i<100;i++){
  const {request}=await import("node:http");
  const status=await new Promise((resolve,reject)=>{
   const req=request(url,{method:"POST",headers:{"content-type":"application/json","Host":"daskalov.example"}},response=>{
    response.resume();response.on("end",()=>resolve(response.statusCode));
   });
   req.on("error",reject);
   req.end(JSON.stringify({provider:"cloud",model:"beam",text:"Hola"}));
  });
  assert.equal(status,403);
 }
 assert.equal(calls,0);
});
test("SEC-005: presupuesto Cloud limitado aun cuando el cliente use IP local",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",llm:async()=>{calls++;return "¡Daskalov!"},maxCloudCallsPerDay:2,maxCallsPerDay:100,maxCallsPerMinute:100});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const url="http://127.0.0.1:"+app.server.address().port+"/api/chat";
 const statuses=[];
 for(let i=0;i<4;i++){
  const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"cloud",model:"beam",text:"Hola"})});
  statuses.push(response.status);
 }
 assert.deepEqual(statuses,[200,200,429,429]);assert.equal(calls,2);
});
test("LLM-005: health del proveedor devuelve estado sin revelar clave",async t=>{
 const app=createApp({dbPath:":memory:",models:async({provider})=>provider==="local"?["qwen2.5:7b"]:["beam"]});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const state=await (await fetch(base+"/api/provider-status?provider=local")).json();
 assert.equal(state.reachable,true);assert.equal(state.models,1);
 assert.ok(!JSON.stringify(state).includes("OLLAMA_API_KEY"));
});
