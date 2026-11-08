import test from "node:test";
import assert from "node:assert/strict";
import {request} from "node:http";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
async function call(base,path,{method="POST",body={},host="public.example"}={}){
 const url=new URL(base+path);
 return new Promise((resolve,reject)=>{
  const req=request({host:"127.0.0.1",port:url.port,path:url.pathname,method,
    headers:{"content-type":"application/json",Host:host}},res=>{
    let raw="";res.on("data",b=>raw+=b);res.on("end",()=>resolve({status:res.statusCode,headers:res.headers,payload:JSON.parse(raw)}));
  });
  req.on("error",reject);req.end(method==="POST"?JSON.stringify(body):undefined);
 });
}
test("MEM-003: public reverse proxy Host cannot create private sessions, memories or progress",async t=>{
 let llmCalls=0;
 const app=createApp({dbPath:":memory:",allowMemory:true,llm:async()=>{llmCalls++;return "Respuesta";}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const origin="http://127.0.0.1:"+app.server.address().port;
 for(const path of ["/api/session","/api/memory","/api/memory/export","/api/progress"]){
  const r=await call(origin,path);assert.equal(r.status,403,path);
  assert.equal(r.headers["set-cookie"],undefined);
 }
 const chat=await call(origin,"/api/chat",{body:{provider:"local",model:"qwen:7b",text:"Recuerda mi nombre",remember:true}});
 assert.equal(chat.status,403);assert.equal(llmCalls,0);
 const get=await call(origin,"/api/session",{method:"GET"});
 assert.equal(get.status,200);assert.equal(get.payload.active,false);
 assert.equal(get.payload.csrfToken,null);
 assert.equal(get.payload.memoryAvailable,false);
});
