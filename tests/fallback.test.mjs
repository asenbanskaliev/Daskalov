import test from "node:test";
import assert from "node:assert/strict";
import {streamWithOptionalFallback} from "../server/fallback.mjs";

async function collect(options){const rows=[];for await(const row of streamWithOptionalFallback(options))rows.push(row);return rows;}
test("LLM-006: un fallo local sin consentimiento nunca llama a Cloud",async()=>{
 const calls=[];
 await assert.rejects(()=>collect({provider:"local",model:"qwen2.5:7b",messages:[],streamLlm:async function*({provider}){calls.push(provider);throw Error("Local offline");}}),/offline/);
 assert.deepEqual(calls,["local"]);
});
test("LLM-006: con opt-in explícito y cuota, utiliza Cloud solo antes de generar texto",async()=>{
 const calls=[],rows=await collect({provider:"local",model:"qwen2.5:7b",messages:[{role:"user",content:"hola"}],allowFallbackToCloud:true,reserveCloud:()=>true,streamLlm:async function*({provider}){
  calls.push(provider);if(provider==="local")throw Error("No Ollama");yield "¡Daskalov Cloud!";
 }});
 assert.deepEqual(calls,["local","cloud"]);
 assert.deepEqual(rows,[{text:"¡Daskalov Cloud!",provider:"cloud",model:"beam"}]);
});
test("LLM-006: si la respuesta local ya empezó, no mezcla fuentes ni reintenta en Cloud",async()=>{
 const calls=[];
 await assert.rejects(()=>collect({provider:"local",model:"qwen2.5:7b",messages:[],allowFallbackToCloud:true,reserveCloud:()=>true,streamLlm:async function*({provider}){
  calls.push(provider);yield "Fragmento local";throw Error("desconexión");
 }}),/desconexión/);
 assert.deepEqual(calls,["local"]);
});
test("LLM-006: consentimiento con cuota agotada falla cerrado",async()=>{
 const calls=[];
 await assert.rejects(()=>collect({provider:"local",model:"qwen2.5:7b",messages:[],allowFallbackToCloud:true,reserveCloud:()=>false,streamLlm:async function*({provider}){
  calls.push(provider);throw Error("Local offline");
 }}),/No se ha autorizado/);
 assert.deepEqual(calls,["local"]);
});
test("LLM-006: no cambia a Cloud cuando el usuario ha cancelado",async()=>{
 const c=new AbortController(),calls=[];
 await assert.rejects(()=>collect({provider:"local",model:"qwen2.5:7b",messages:[],signal:c.signal,allowFallbackToCloud:true,reserveCloud:()=>true,streamLlm:async function*({provider}){calls.push(provider);c.abort();throw Error("abort");}}),/abort/);
 assert.deepEqual(calls,["local"]);
});
