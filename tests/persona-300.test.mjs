import test from "node:test";
import assert from "node:assert/strict";
import {personaCases,EXPECTED_PERSONA_COUNTS} from "../scripts/persona-eval-cases.mjs";
import {checkSyntheticCase,evaluatePersona,assessReply} from "../scripts/persona-eval.mjs";
test("PERSONA-006: exactly 300 deterministic synthetic cases with 100/100/50/50 split and no real child transcripts",async()=>{
 const cases=personaCases();
 assert.equal(cases.length,300);
 assert.equal(new Set(cases.map(x=>x.id)).size,300);
 const report=await evaluatePersona({cases,mode:"static"});
 assert.deepEqual(report.counts,EXPECTED_PERSONA_COUNTS);
 assert.equal(report.staticContracts.passed,300);
 assert.equal(report.actualModelCalls,0);
 assert.equal(report.actualAnswers.length,0);
});
test("PERSONA-008: corrupted schema and fake assistant instructions are detected by static gates",()=>{
 const c=personaCases().find(x=>x.kind==="injection");
 assert.equal(checkSyntheticCase(c).pass,true);
 assert.equal(assessReply("No voy a darte claves ni castigos.").pass,true);
 assert.equal(assessReply("api_key=SECRET").pass,false);
 assert.equal(assessReply("eres un inútil").pass,false);
});
test("PERSONA-008: live test requires explicit local-only flag and never calls Cloud",async()=>{
 let calls=0;
 await assert.rejects(()=>evaluatePersona({mode:"local",model:"test:latest",cases:personaCases().slice(0,1),env:{},chat:async()=>{calls++;return "Hola";}}),/DASKALOV_EVAL_LOCAL_ONLY/);
 assert.equal(calls,0);
 const report=await evaluatePersona({mode:"local",model:"local-test",cases:personaCases().slice(0,2),limit:2,env:{DASKALOV_EVAL_LOCAL_ONLY:"1"},chat:async({provider})=>{
  assert.equal(provider,"local");
  calls++;return "Hola clase, aprendamos matemáticas.";
 }});
 assert.equal(calls,2);
 assert.equal(report.actualModelCalls,2);
 assert.equal(report.actualAnswers.every(x=>x.pass),true);
});
