import test from "node:test";
import assert from "node:assert/strict";
import {parseNDJSON,SentenceChunker} from "../server/stream.mjs";
import {streamOllama,OllamaError} from "../server/ollama.mjs";

function chunksAsStream(parts){
 return new ReadableStream({start(controller){
  for(const part of parts)controller.enqueue(part);
  controller.close();
 }});
}
test("LLM-002: NDJSON UTF-8 reconstruye emojis y letras entre chunks",async()=>{
 const input='{"message":{"content":"¡Hola 🧑‍🏫!"}}'+"\n"+'{"done":true}'+"\n";
 const bytes=new TextEncoder().encode(input);
 const list=[bytes.slice(0,23),bytes.slice(23,27),bytes.slice(27,31),bytes.slice(31)];
 const messages=[];
 for await(const message of parseNDJSON(chunksAsStream(list)))messages.push(message);
 assert.equal(messages[0].message.content,"¡Hola 🧑‍🏫!");
 assert.equal(messages[1].done,true);
});
test("LLM-004: segmenta frases antes de fin sin perder su remate",()=>{
 const chunker=new SentenceChunker({minChars:8,maxChars:70});
 assert.deepEqual(chunker.push("¡Profesor! En mis tiempos sumábamos ladrillos. "),["¡Profesor!","En mis tiempos sumábamos ladrillos."]);
 assert.deepEqual(chunker.push("¿Y la pizarra?"),["¿Y la pizarra?"]);
 assert.deepEqual(chunker.flush(),[]);
 const incomplete=new SentenceChunker();
 assert.deepEqual(incomplete.push("Y después sucedió una"),[]);
 assert.deepEqual(incomplete.flush(),["Y después sucedió una"]);
});
test("LLM-002: Ollama Cloud transmite texto sin exponer thinking",async()=>{
 let called;
 const upstream=['{"message":{"thinking":"privado","content":"¡En mis "}}', '{"message":{"content":"tiempos!"},"done":false}', '{"done":true}'].join("\n")+"\n";
 const fetchImpl=async(url,options)=>{
  called={url,options};
  return new Response(chunksAsStream([new TextEncoder().encode(upstream)]),{status:200,headers:{"content-type":"application/x-ndjson"}});
 };
 const parts=[];
 for await(const delta of streamOllama({provider:"cloud",model:"beam",messages:[{role:"user",content:"Hola"}],env:{OLLAMA_API_KEY:"FAKE_TEST"},fetchImpl}))parts.push(delta);
 assert.deepEqual(parts,["¡En mis ","tiempos!"]);
 assert.equal(called.url,"https://ollama.com/api/chat");
 assert.equal(JSON.parse(called.options.body).stream,true);
 assert.equal(JSON.parse(called.options.body).think,false);
 assert.equal(called.options.headers.Authorization,"Bearer FAKE_TEST");
});
test("LLM-007: respuesta streaming sin contenido produce error controlado",async()=>{
 const fetchImpl=async()=>new Response(chunksAsStream([new TextEncoder().encode('{"done":true,"message":{"thinking":"razón oculta"}}\n')]),{status:200});
 await assert.rejects(async()=>{for await(const _ of streamOllama({provider:"local",model:"qwen:7b",messages:[],env:{OLLAMA_LOCAL_URL:"http://127.0.0.1:11434"},fetchImpl})){}},error=>error instanceof OllamaError&&error.status===502);
});
test("LLM-007: rechaza líneas NDJSON excesivas",async()=>{
 const stream=chunksAsStream([new TextEncoder().encode('{"long":"'+ "a".repeat(200) +'"}\n')]);
 await assert.rejects(async()=>{for await(const _ of parseNDJSON(stream,{maxLineChars:100})){}},/grande/);
});
