import test from "node:test";
import assert from "node:assert/strict";
import {retryLocalStream} from "../server/resilience.mjs";

async function collect(input){const out=[];for await(const x of retryLocalStream(input))out.push(x);return out;}
test("LLM-007: 100 transient local failures retry only before visible output",async()=>{
 for(let i=0;i<100;i++){
  let attempts=0;
  const result=await collect({provider:"local",delayMs:0,run:async function*(){
   attempts++;
   if(attempts===1)throw Error("HTTP "+[429,500,502,503,504][i%5]);
   yield "respuesta";
  }});
  assert.deepEqual(result,["respuesta"]);
  assert.equal(attempts,2);
 }
});
test("LLM-007: Cloud is not automatically retried when it may cost money",async()=>{
 let calls=0;
 await assert.rejects(()=>collect({provider:"cloud",delayMs:0,run:async function*(){calls++;throw Error("HTTP 503");}}),/503/);
 assert.equal(calls,1);
});
test("LLM-007: no replay after partial output or cancellation",async()=>{
 let calls=0;
 await assert.rejects(()=>collect({provider:"local",delayMs:0,run:async function*(){calls++;yield "partial";throw Error("HTTP 503");}}),/503/);
 assert.equal(calls,1);
 const cancelled=new AbortController();cancelled.abort();
 await assert.rejects(()=>collect({provider:"local",signal:cancelled.signal,delayMs:0,run:async function*(){throw Error("HTTP 503");}}),/503/);
});
