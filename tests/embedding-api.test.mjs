import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

test("MEM-006: reindex requires player session/CSRF, stores local vectors and FTS5 survives unavailable Ollama",async t=>{
 const previous={enabled:process.env.DASKALOV_ENABLE_LOCAL_EMBEDDINGS,model:process.env.DASKALOV_EMBED_MODEL};
 process.env.DASKALOV_ENABLE_LOCAL_EMBEDDINGS="1";
 process.env.DASKALOV_EMBED_MODEL="embeddinggemma";
 let embedCalls=0,fail=false;
 const conversations=[];
 const app=createApp({
  dbPath:":memory:",
  allowMemory:true,
  embedder:async({input})=>{
   embedCalls++;
   if(fail)throw Error("Ollama local disconnected");
   return /historia/i.test(input)?[1,0,0]:[0,1,0];
  },
  llm:async payload=>{conversations.push(payload);return "¡La historia es interesante!"}
 });
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{
  await new Promise(done=>app.server.close(done));app.close();
  for(const [key,name] of [["enabled","DASKALOV_ENABLE_LOCAL_EMBEDDINGS"],["model","DASKALOV_EMBED_MODEL"]]){
   if(previous[key]===undefined)delete process.env[name];else process.env[name]=previous[key];
  }
 });
 const base="http://127.0.0.1:"+app.server.address().port;
 const post=(route,body={},cookie="",csrf="")=>fetch(base+route,{
  method:"POST",
  headers:{"content-type":"application/json",...(cookie?{cookie}:{}),...(csrf?{"x-daskalov-csrf":csrf}:{})},
  body:JSON.stringify(body)
 });
 const session=async()=>{
  const response=await post("/api/session");
  return {cookie:response.headers.get("set-cookie").split(";")[0],csrf:(await response.json()).csrfToken};
 };
 const playerA=await session(),playerB=await session();
 const chat={provider:"local",model:"qwen2.5:7b",text:"Me gusta la historia",remember:true};
 assert.equal((await post("/api/chat",chat,playerA.cookie,playerA.csrf)).status,200);
 assert.equal((await post("/api/memory/reindex",{})).status,401);
 assert.equal((await post("/api/memory/reindex",{},playerA.cookie)).status,403);
 const result=await (await post("/api/memory/reindex",{limit:5},playerA.cookie,playerA.csrf)).json();
 assert.equal(result.cloudUsed,false);
 assert.ok(result.indexed>=1);
 const empty=await (await post("/api/memory/reindex",{limit:5},playerB.cookie,playerB.csrf)).json();
 assert.equal(empty.indexed,0);
 assert.equal((await post("/api/chat",{...chat,text:"¿Qué tema me gusta?"},playerA.cookie,playerA.csrf)).status,200);
 assert.ok(embedCalls>=3);
 assert.ok(conversations.at(-1).messages.some(m=>m.content.includes("historia")));
 fail=true;
 assert.equal((await post("/api/chat",{...chat,text:"¿Qué dije sobre historia?"},playerA.cookie,playerA.csrf)).status,200);
 assert.ok(conversations.at(-1).messages.some(m=>m.content.includes("historia")));
});
