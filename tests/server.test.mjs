import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

test("servidor real, modelo mock, memoria con sesión y borrado seguro",async(t)=>{
 const calls=[];
 const app=createApp({dbPath:":memory:",allowMemory:true,llm:async(arg)=>{calls.push(arg);return "¡En mis tiempos hasta la pizarra estudiaba!"},models:async()=>["beam"]});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const host="http://127.0.0.1:"+app.server.address().port;
 const page=await fetch(host+"/");assert.equal(page.status,200);assert.match(await page.text(),/Profesor Daskalov/);
 const post=(endpoint,data={},cookie="",csrf="",method="POST")=>fetch(host+endpoint,{method,headers:{"content-type":"application/json",...(cookie?{cookie}:{}),...(csrf?{"x-daskalov-csrf":csrf}:{})},body:JSON.stringify(data)});
 const login=await post("/api/session");assert.equal(login.status,200);
 const csrf=(await login.json()).csrfToken,cookie=login.headers.get("set-cookie").split(";")[0];
 const base={provider:"cloud",model:"beam",text:"¿Puedo hablar?",event:"dialog"};
 let response=await post("/api/chat",{...base,remember:false});
 assert.equal(response.status,200);assert.match((await response.json()).reply,/pizarra/);
 response=await post("/api/chat",{...base,remember:true},cookie,csrf);
 assert.equal(response.status,200);assert.equal(calls.length,2);
 const memories=await post("/api/memory",{},cookie,csrf);
 assert.equal(memories.status,200);assert.equal((await memories.json()).memories.length,2);
 response=await post("/api/chat",{...base,model:"http://evil",remember:true},cookie,csrf);assert.equal(response.status,400);
 response=await post("/api/memory",{},cookie,csrf,"DELETE");assert.equal(response.status,200);
 const inaccessible=await post("/api/memory",{},cookie,csrf);assert.equal(inaccessible.status,401);
});
