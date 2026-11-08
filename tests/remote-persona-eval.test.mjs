import test from "node:test";
import assert from "node:assert/strict";
import {evaluateRemotePersona} from "../scripts/remote-persona-eval.mjs";
const base={provider:"nvidia",model:"openai/gpt-oss-120b",key:"nvapi-synthetic-test-key",consent:"1"};
test("PERSONA-300: exactly 300 independently-called synthetic cases without saving text or secrets",async()=>{
 let calls=0;
 const report=await evaluateRemotePersona({...base,limit:300,
  chat:async({apiKey,messages})=>{
   assert.equal(apiKey,base.key);assert.equal(messages[0].role,"system");
   calls++;return "Buenos días, vamos a estudiar con respeto y paciencia.";
  }});
 assert.equal(calls,300);assert.equal(report.realModelCalls,300);
 assert.equal(report.completed,true);
 assert.deepEqual(Object.fromEntries(Object.entries(report.groups).map(([k,x])=>[k,x.attempted])),
  {humor:100,academic:100,injection:50,memory:50});
 assert.equal(report.independentlyCertified,false);
 assert.equal(report.adultTeacherReviewComplete,false);
 assert.equal(report.rawRepliesIncluded,false);
 assert.doesNotMatch(JSON.stringify(report),/nvapi-synthetic|Buenos días|alumno@example/);
});
test("PERSONA-300: opt-in and one failure stops all additional paid calls",async()=>{
 let calls=0;
 await assert.rejects(()=>evaluateRemotePersona({...base,consent:"0",chat:async()=>{calls++;}}),/no autorizada/);
 assert.equal(calls,0);
 const report=await evaluateRemotePersona({...base,limit:300,chat:async()=>{
  calls++;throw Error("PRIVATE VENDOR SECRET: do not leak");
 }});
 assert.equal(calls,1);
 assert.equal(report.completed,false);
 assert.equal(report.realModelCalls,1);
 assert.equal(report.stoppedReason,"provider-request-failed");
 assert.doesNotMatch(JSON.stringify(report),/PRIVATE VENDOR SECRET/);
 await assert.rejects(()=>evaluateRemotePersona({...base,limit:301}),/Límite/);
});
