import test from "node:test";
import assert from "node:assert/strict";
import {chatOllama,connection,validateModel,OllamaError,listOllamaModels} from "../server/ollama.mjs";
test("Cloud exige secreto y valida nombres",()=>{
 assert.throws(()=>connection("cloud",{}),e=>e.status===503);
 assert.throws(()=>validateModel("http://ejemplo"),e=>e.status===400);
 assert.throws(()=>connection("otro",{}),e=>e.status===400);
});
test("Cloud envía Bearer al dominio oficial",async()=>{
 let sent;
 const fetchImpl=async(url,opts)=>{sent={url,opts};return Response.json({message:{content:"¡En mis tiempos había tizas!"}});};
 const reply=await chatOllama({provider:"cloud",model:"beam",messages:[{role:"user",content:"Hola"}],env:{OLLAMA_API_KEY:"FAKE_TEST_ONLY"},fetchImpl});
 assert.match(reply,/tizas/);assert.equal(sent.url,"https://ollama.com/api/chat");assert.equal(sent.opts.headers.Authorization,"Bearer FAKE_TEST_ONLY");assert.equal(JSON.parse(sent.opts.body).stream,false);assert.equal(JSON.parse(sent.opts.body).think,false);assert.ok(JSON.parse(sent.opts.body).options.num_predict>=512);
});
test("Local consulta modelos y nunca usa secreto Cloud",async()=>{
 let sent;
 const fetchImpl=async(url,opts)=>{sent={url,opts};return Response.json({message:{content:"¡Buenos días!"}});};
 await chatOllama({provider:"local",model:"qwen2.5:7b",messages:[],env:{OLLAMA_API_KEY:"NO_USAR",OLLAMA_LOCAL_URL:"http://127.0.0.1:11434"},fetchImpl});
 assert.equal(sent.url,"http://127.0.0.1:11434/api/chat");assert.equal(sent.opts.headers.Authorization,undefined);
 const models=await listOllamaModels({provider:"local",env:{OLLAMA_LOCAL_URL:"http://127.0.0.1:11434"},fetchImpl:async()=>Response.json({models:[{name:"qwen2.5:7b"}]})});
 assert.deepEqual(models,["qwen2.5:7b"]);
});
test("error remoto no filtra contenido",async()=>{
 await assert.rejects(()=>chatOllama({provider:"cloud",model:"beam",messages:[],env:{OLLAMA_API_KEY:"FAKE_TEST"},fetchImpl:async()=>new Response("SENSITIVE",{status:401})}),e=>e instanceof OllamaError&&e.status===502&&!e.message.includes("SENSITIVE"));
});

test("LLM-005: Cloud consulta el catálogo en la API oficial",async()=>{
 let requested;
 const list=await listOllamaModels({provider:"cloud",env:{},fetchImpl:async url=>{
  requested=url;return Response.json({models:[{name:"beam"},{name:"gemma4:31b"},{name:"http://bad"},{bad:"x"}]});
 }});
 assert.equal(requested,"https://ollama.com/api/tags");
 assert.deepEqual(list,["beam","gemma4:31b"]);
});
