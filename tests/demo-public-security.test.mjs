import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
test("SAFE-005: demo-only mode blocks all private and chargeable endpoints",async t=>{
 const old=process.env.DASKALOV_SAFE_DEMO_ONLY;
 process.env.DASKALOV_SAFE_DEMO_ONLY="1";
 const app=createApp({dbPath:":memory:",allowMemory:true,llm:async()=>{throw Error("Cloud not allowed");}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{
  await new Promise(resolve=>app.server.close(resolve));app.close();
  if(old===undefined)delete process.env.DASKALOV_SAFE_DEMO_ONLY;else process.env.DASKALOV_SAFE_DEMO_ONLY=old;
 });
 const base="http://127.0.0.1:"+app.server.address().port;
 let response=await fetch(base+"/api/health");
 assert.equal(response.status,200);
 const h=await response.json();assert.equal(h.demoOnly,true);assert.equal(h.cloudConfigured,false);
 for(const path of ["/api/session","/api/models?provider=cloud","/api/metrics","/api/stt/status","/api/tts/status"]){
  assert.equal((await fetch(base+path)).status,403,path);
 }
 const request={method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"cloud",model:"beam",text:"Hola"})};
 response=await fetch(base+"/api/chat/stream",request);
 assert.equal(response.status,403);
 response=await fetch(base+"/api/chat",request);
 assert.equal(response.status,403);
});
