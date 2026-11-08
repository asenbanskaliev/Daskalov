import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
async function create(t,llm){
 const app=createApp({dbPath:":memory:",streamLlm:llm});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(r=>app.server.close(r));app.close();});
 return "http://127.0.0.1:"+app.server.address().port;
}
async function ask(base,permission){
 const r=await fetch(base+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"Hola",allowFallbackToCloud:permission})});
 return (await r.text()).trim().split("\n").map(JSON.parse);
}
test("LLM-006: sin consentimiento hay 0 llamadas Cloud, con permiso una llamada",async t=>{
 const calls=[];
 const base=await create(t,async function*({provider}){calls.push(provider);if(provider==="local")throw Error("offline");yield "Cloud";});
 const without=await ask(base,false);
 assert.equal(without.at(-1).type,"error");
 assert.deepEqual(calls,["local"]);
 const approved=await ask(base,true);
 assert.equal(approved.at(-1).type,"completed");
 assert.equal(approved.at(-1).provider,"cloud");
 assert.equal(approved.find(e=>e.type==="provider-switched").provider,"cloud");
 assert.deepEqual(calls,["local","local","cloud"]);
});
test("LLM-006: si local emite texto parcial, no mezcla Cloud",async t=>{
 const calls=[];
 const base=await create(t,async function*({provider}){calls.push(provider);yield "texto local";throw Error("fail");});
 const result=await ask(base,true);
 assert.equal(result.at(-1).type,"error");
 assert.deepEqual(calls,["local"]);
});
