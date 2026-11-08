import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
async function setup(t){
 const calls=[];
 const app=createApp({dbPath:":memory:",maxCloudCallsPerDay:2,
  models:async()=>["qwen2.5:7b"],
  remoteModels:async args=>{calls.push({type:"models",...args});return ["deepseek/deepseek-chat:free"];},
  remoteLlm:async args=>{calls.push({type:"chat",...args});return "Profesor Daskalov responde";},
  remoteStream:async function* (args){calls.push({type:"stream",...args});yield "Profesor ";yield "responde bien.";}
 });
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 return {url:"http://127.0.0.1:"+app.server.address().port,calls};
}
test("AI-011: API credential required for private remote model catalog and status",async t=>{
 const {url,calls}=await setup(t),key="sk-or-v1-test-private";
 assert.equal((await fetch(url+"/api/models?provider=openrouter")).status,401);
 const res=await fetch(url+"/api/models?provider=openrouter",{headers:{"x-daskalov-provider-key":key}});
 assert.equal(res.status,200);
 assert.deepEqual((await res.json()).models,["deepseek/deepseek-chat:free"]);
 assert.equal(calls[0].apiKey,key);
 assert.equal((await fetch(url+"/api/provider-status?provider=nvidia",{headers:{"x-daskalov-provider-key":"nvapi-test-12345"}})).status,200);
});
test("AI-011: remote chat and streaming dispatch to correct API key with no fallback",async t=>{
 const {url,calls}=await setup(t),key="nvapi-test-12345";
 const request=()=>fetch(url+"/api/chat",{method:"POST",headers:{"content-type":"application/json","x-daskalov-provider-key":key},
 body:JSON.stringify({provider:"nvidia",model:"openai/gpt-oss-120b",text:"Hola"})});
 const first=await request();
 assert.equal(first.status,200);
 assert.match((await first.json()).reply,/Daskalov/);
 const streamed=await fetch(url+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json","x-daskalov-provider-key":key},
 body:JSON.stringify({provider:"nvidia",model:"openai/gpt-oss-120b",text:"Hola"})});
 assert.equal(streamed.status,200);
 const rows=(await streamed.text()).trim().split("\n").map(JSON.parse);
 assert.equal(rows.at(-1).type,"completed");
 assert.equal(rows.at(-1).provider,"nvidia");
 assert.equal(calls.find(x=>x.type==="chat").apiKey,key);
 assert.equal(calls.find(x=>x.type==="stream").apiKey,key);
 assert.equal((await request()).status,429,"combined paid-provider budget max two turns");
});
test("AI-011: provider API keys never forwarded to local Ollama or entered in public demo",async t=>{
 const {url,calls}=await setup(t);
 const local=await fetch(url+"/api/models?provider=local",{headers:{"x-daskalov-provider-key":"nvapi-should-not-go-to-ollama"}});
 assert.equal(local.status,200);
 assert.deepEqual(calls,[]);
 const bad=await fetch(url+"/api/chat",{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({provider:"openrouter",model:"deepseek/deepseek-chat:free",text:"Hola"})});
 assert.equal(bad.status,401);
});
