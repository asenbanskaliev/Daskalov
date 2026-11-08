import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

function post(base,path,body={},cookie="",csrf="",method="POST"){
 const headers={"content-type":"application/json"};
 if(cookie)headers.cookie=cookie;
 if(csrf)headers["x-daskalov-csrf"]=csrf;
 return fetch(base+path,{method,headers,body:JSON.stringify(body)});
}
async function fixture(t,opts={}){
 const calls=[];
 const app=createApp({dbPath:":memory:",allowMemory:true,llm:async(payload)=>{calls.push(payload);return "¡Daskalov recuerda la pizarra!"},...opts});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 return {base:"http://127.0.0.1:"+app.server.address().port,calls};
}
async function auth(base){
 const r=await post(base,"/api/session");
 assert.equal(r.status,200);
 const value=await r.json();
 assert.equal(typeof value.csrfToken,"string");
 assert.match(r.headers.get("set-cookie")||"",/HttpOnly/);
 assert.match(r.headers.get("set-cookie")||"",/SameSite=Strict/);
 return {cookie:r.headers.get("set-cookie").split(";")[0],csrf:value.csrfToken};
}

test("SEC-004: UUID de otro jugador ya NO sirve como autenticación",async(t)=>{
 const {base}=await fixture(t);
 const a=await auth(base),b=await auth(base);
 let r=await post(base,"/api/chat",{provider:"cloud",model:"beam",text:"Me gustan las matemáticas",remember:true},a.cookie,a.csrf);
 assert.equal(r.status,200);
 r=await post(base,"/api/memory",{"playerId":"00000000-0000-4000-8000-000000000000"});
 assert.equal(r.status,401);
 r=await post(base,"/api/memory",{},b.cookie,b.csrf);
 assert.equal(r.status,200);
 assert.equal((await r.json()).memories.length,0);
 r=await post(base,"/api/memory",{},a.cookie,a.csrf);
 assert.equal(r.status,200);
 assert.equal((await r.json()).memories.length,2);
 r=await post(base,"/api/memory",{"playerId":"00000000-0000-4000-8000-000000000000"},b.cookie,b.csrf);
 assert.equal(r.status,400);
});
test("SEC-004: sin CSRF válido no se permite borrar recuerdos",async(t)=>{
 const {base}=await fixture(t),a=await auth(base);
 const missing=await post(base,"/api/memory",{},a.cookie,"","DELETE");
 assert.equal(missing.status,403);
 const forged=await post(base,"/api/memory",{},a.cookie,"falso","DELETE");
 assert.equal(forged.status,403);
 const valid=await post(base,"/api/memory",{},a.cookie,a.csrf,"DELETE");
 assert.equal(valid.status,200);
});
test("SEC-006: memoria desactivada desde servidor y navegador no almacena",async(t)=>{
 const {base}=await fixture(t,{allowMemory:false});
 const session=await post(base,"/api/session");
 assert.equal(session.status,403);
 const r=await post(base,"/api/chat",{provider:"cloud",model:"beam",text:"Hola",remember:false});
 assert.equal(r.status,200);
 const a=await post(base,"/api/chat",{provider:"cloud",model:"beam",text:"Hola",remember:true});
 assert.equal(a.status,403);
});
test("SEC-005: cuota por IP y máximo un turno simultáneo",async(t)=>{
 let release;
 const task=new Promise(resolve=>{release=resolve;});
 const {base,calls}=await fixture(t,{maxCallsPerMinute:2,maxConcurrent:1,llm:async(payload)=>{calls.push(payload);await task;return "Terminé";}});
 const body={provider:"local",model:"qwen2.5:7b",text:"Hola",remember:false};
 const first=post(base,"/api/chat",body);
 // Ensure first request had entered LLM before submitting the second.
 for(let i=0;i<50&&calls.length===0;i++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(calls.length,1);
 const second=await post(base,"/api/chat",body);
 assert.equal(second.status,429);
 release();
 assert.equal((await first).status,200);
});
test("SEC-004: sesión persiste tras reiniciar servidor sin guardar su cookie en claro",async(t)=>{
 const {mkdtempSync,readFileSync,rmSync}=await import("node:fs");
 const {tmpdir}=await import("node:os");
 const {join}=await import("node:path");
 const dir=mkdtempSync(join(tmpdir(),"daskalov-session-test-"));
 const dbPath=join(dir,"memory.sqlite");
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 async function boot(){
  const app=createApp({dbPath,allowMemory:true,llm:async()=>"¡Hola, alumno!"});
  app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
  return {app,base:"http://127.0.0.1:"+app.server.address().port};
 }
 const one=await boot(),a=await auth(one.base);
 let r=await post(one.base,"/api/chat",{provider:"cloud",model:"beam",text:"Recuerda que me gustan las mates",remember:true},a.cookie,a.csrf);
 assert.equal(r.status,200);
 await new Promise(done=>one.app.server.close(done));one.app.close();
 const data=readFileSync(dbPath);
 const raw=a.cookie.split("=")[1];
 assert.equal(data.includes(Buffer.from(raw)),false);
 const two=await boot();
 t.after(async()=>{await new Promise(done=>two.app.server.close(done));two.app.close();});
 r=await post(two.base,"/api/memory",{},a.cookie,a.csrf);
 assert.equal(r.status,200);
 assert.equal((await r.json()).memories.length,2);
});
test("SEC-005: límite diario impide repetir consumo aunque no se alcance el minuto",async(t)=>{
 const {base}=await fixture(t,{maxCallsPerDay:1});
 const body={provider:"cloud",model:"beam",text:"Hola",remember:false};
 assert.equal((await post(base,"/api/chat",body)).status,200);
 assert.equal((await post(base,"/api/chat",body)).status,429);
});
test("SEC-004: bloquea origen ajeno antes de crear memoria",async(t)=>{
 const {base}=await fixture(t);
 const res=await fetch(base+"/api/session",{method:"POST",headers:{origin:"https://otro.example"}});
 assert.equal(res.status,403);
});

test("SEC-010: entire private player API requires cookie plus CSRF, cross-site GET is denied",async t=>{
 const {base}=await fixture(t);
 const session=await auth(base);
 const endpoints=[
  ["/api/memory",{}, "POST"],["/api/memory",{}, "DELETE"],
  ["/api/memory/export",{}, "POST"],["/api/memory/correct",{id:1,content:"hola"},"POST"],
  ["/api/memory/reindex",{limit:1},"POST"],["/api/progress",{readOnly:true},"POST"],
  ["/api/chat",{provider:"local",model:"qwen2.5:7b",text:"hola",remember:true},"POST"],
  ["/api/chat/stream",{provider:"local",model:"qwen2.5:7b",text:"hola",remember:true},"POST"]
 ];
 for(const [path,body,method] of endpoints){
  assert.equal((await post(base,path,body,"","",method)).status,401,path+" anonymous");
  assert.equal((await post(base,path,body,session.cookie,"",method)).status,403,path+" missing csrf");
 }
 const cross=await fetch(base+"/api/session",{headers:{cookie:session.cookie,origin:"https://attacker.invalid"}});
 assert.equal(cross.status,403);
 assert.equal((await post(base,"/api/memory/export",{},session.cookie,session.csrf)).status,200);
});
