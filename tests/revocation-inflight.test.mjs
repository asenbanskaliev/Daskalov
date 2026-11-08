import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
import {getSession} from "../server/session.mjs";

const post=(base,path,body,auth={})=>fetch(base+path,{method:"POST",
 headers:{"content-type":"application/json",...(auth.cookie?{cookie:auth.cookie}:{}),
 ...(auth.csrf?{"x-daskalov-csrf":auth.csrf}:{})},body:JSON.stringify(body)});
async function runRevocationRace(t,stream){
 let signalStart,release;
 const started=new Promise(resolve=>signalStart=resolve);
 const gate=new Promise(resolve=>release=resolve);
 const app=createApp({dbPath:":memory:",allowMemory:true,
  llm:async()=>{signalStart();await gate;return "Profesor responde sin guardar recuerdos.";},
  streamLlm:async function*(){signalStart();await gate;yield "Profesor responde sin guardar recuerdos.";}
 });
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{release?.();await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const response=await post(base,"/api/session",{});
 assert.equal(response.status,200);
 const auth={cookie:response.headers.get("set-cookie").split(";")[0],
  csrf:(await response.json()).csrfToken};
 const owner=getSession({headers:{cookie:auth.cookie}},app.memory)?.playerId;
 assert.ok(owner);
 const path=stream?"/api/chat/stream":"/api/chat";
 const pending=post(base,path,{provider:"local",model:"qwen2.5:7b",
  text:"Quiero aprender geometría",remember:true},auth);
 let timeoutId;
 const timeout=new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(Error("Model call did not start")),5000);});
 await Promise.race([started,timeout]);clearTimeout(timeoutId);
 const erased=await fetch(base+"/api/memory",{method:"DELETE",
  headers:{"content-type":"application/json",cookie:auth.cookie,"x-daskalov-csrf":auth.csrf},body:"{}"});
 assert.equal(erased.status,200);
 release();
 const answer=await pending;
 assert.equal(answer.status,200);
 if(stream)assert.ok((await answer.text()).split("\n").some(x=>x.includes('"type":"completed"')));
 else assert.match((await answer.json()).reply,/responde/);
 assert.equal(getSession({headers:{cookie:auth.cookie}},app.memory),null);
 assert.deepEqual(app.memory.list(owner),[],"pending LLM completion must not revive erased memories");
 assert.deepEqual(app.memory.getProgress(owner),[]);
 assert.equal(app.memory.integrity().ftsCount,0);
}
test("MEM-007: revocation during nonstream LLM completion never revives erased player",async t=>runRevocationRace(t,false));
test("MEM-007: revocation during streamed LLM completion never revives erased player",async t=>runRevocationRace(t,true));
