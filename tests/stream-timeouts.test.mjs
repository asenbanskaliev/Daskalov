import test from "node:test";
import assert from "node:assert/strict";
import {streamOllama,OllamaError} from "../server/ollama.mjs";
async function collect(options){const out=[];for await(const x of streamOllama({provider:"local",model:"qwen:7b",messages:[],env:{OLLAMA_LOCAL_URL:"http://127.0.0.1:11434"},...options}))out.push(x);return out;}
test("LLM-007: límite independiente para establecer conexión",async()=>{
 let calls=0;
 await assert.rejects(()=>collect({
  connectTimeoutMs:20,idleTimeoutMs:1000,
  fetchImpl:async(url,{signal})=>new Promise((resolve,reject)=>{
   calls++;signal.addEventListener("abort",()=>reject(Error("aborted")),{once:true});
  })
 }),e=>e instanceof OllamaError&&e.status===502);
 assert.equal(calls,1);
});
test("LLM-007: flujo sin actividad finaliza sin colgar el proceso",async()=>{
 const start=Date.now();
 await assert.rejects(()=>collect({
  connectTimeoutMs:200,idleTimeoutMs:25,
  fetchImpl:async()=>new Response(new ReadableStream({start(){},cancel(){}}),{status:200})
 }),e=>e instanceof OllamaError&&e.status===502);
 assert.ok(Date.now()-start<1500,"idle timeout should finish quickly");
});
test("LLM-007: recepción periódica de chunks restablece el timeout de inactividad",async()=>{
 const bytes=new TextEncoder();
 const result=await collect({
  connectTimeoutMs:200,idleTimeoutMs:70,
  fetchImpl:async()=>new Response(new ReadableStream({
   async start(controller){
    controller.enqueue(bytes.encode('{"message":{"content":"Hola "}}\n'));
    await new Promise(resolve=>setTimeout(resolve,20));
    controller.enqueue(bytes.encode('{"message":{"content":"profesor"}}\n'));
    controller.close();
   }
  }),{status:200})
 });
 assert.deepEqual(result,["Hola ","profesor"]);
});
