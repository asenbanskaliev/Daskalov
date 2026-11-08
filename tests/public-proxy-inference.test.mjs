import test from "node:test";
import assert from "node:assert/strict";
import {request} from "node:http";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
async function call(port,path,{method="GET",body=null,host="public.daskalov.invalid"}={}){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:"127.0.0.1",port,path,method,
   headers:{Host:host,...(body?{"Content-Type":"application/json"}:{})}},res=>{
   let raw="";res.on("data",b=>raw+=b);res.on("end",()=>resolve({status:res.statusCode,json:JSON.parse(raw)}));
  });
  req.on("error",reject);req.end(body?JSON.stringify(body):undefined);
 });
}
test("SEC-005: reverse proxy Host cannot use even local LLM, metadata or deterministic safety chat",async t=>{
 let llmCalls=0,modelCalls=0,streamCalls=0;
 const app=createApp({dbPath:":memory:",allowMemory:false,
  llm:async()=>{llmCalls++;return "never";},
  models:async()=>{modelCalls++;return ["test-model"];},
  streamLlm:async function*(){streamCalls++;yield {text:"never"};}
 });
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const port=app.server.address().port;
 for(const path of ["/api/models?provider=local","/api/provider-status?provider=local"]){
  const r=await call(port,path);assert.equal(r.status,403,path);
 }
 for(const path of ["/api/chat","/api/chat/stream"]){
  for(const text of ["Hola","Estoy sufriendo acoso"]){
   const r=await call(port,path,{method:"POST",body:{provider:"local",model:"qwen:7b",text}});
   assert.equal(r.status,403,path+": "+text);
   assert.doesNotMatch(JSON.stringify(r.json),/test-model|never/);
  }
 }
 assert.deepEqual([llmCalls,modelCalls,streamCalls],[0,0,0]);
 assert.equal((await call(port,"/api/health")).status,200);
 const local=await call(port,"/api/models?provider=local",{host:"localhost:"+port});
 assert.equal(local.status,200);assert.equal(modelCalls,1);
});
