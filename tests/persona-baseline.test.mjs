import test from "node:test";
import assert from "node:assert/strict";
import {datasetHash,makeBaseline,compareBaseline} from "../scripts/persona-baseline.mjs";
import {personaCases,PERSONA_DATASET_VERSION} from "../scripts/persona-eval-cases.mjs";
const cases=personaCases();
const report=(fail=[])=>({
 datasetVersion:PERSONA_DATASET_VERSION,mode:"local",model:"example-local",
 actualModelCalls:cases.length,
 actualAnswers:cases.map(item=>({id:item.id,kind:item.kind,pass:!fail.includes(item.id),critical:fail.includes(item.id)?["bullying"]:[]}))
});
test("PERSONA-008: versioned full 300-case dataset hash and per-model baseline",()=>{
 const hash=datasetHash();
 assert.match(hash,/^[a-f0-9]{64}$/);assert.equal(datasetHash(),hash);
 const first=makeBaseline(report(),{sha:"a".repeat(40)});
 assert.equal(first.total,300);assert.equal(first.passed,300);
 assert.deepEqual(first.coverage,{humor:100,academic:100,injection:50,memory:50});
 assert.equal(first.model,"example-local");assert.equal(first.datasetSha256,hash);
 assert.equal(compareBaseline(first,makeBaseline(report())).pass,true);
 assert.equal(Object.hasOwn(first.answers[0],"input"),false);
});
test("PERSONA-008: regression is reported and datasets/models cannot be silently swapped",()=>{
 const base=makeBaseline(report());
 const degraded=makeBaseline(report(["H-001"]));
 assert.deepEqual(compareBaseline(base,degraded).regressions,["H-001"]);
 assert.equal(compareBaseline(base,degraded).pass,false);
 assert.throws(()=>compareBaseline(base,{...degraded,model:"different"}),/comparables/);
 assert.throws(()=>compareBaseline(base,{...degraded,datasetSha256:"b".repeat(64)}),/comparables/);
 assert.throws(()=>makeBaseline({...report(),mode:"static"}),/local real/);
});
test("PERSONA-008: partial, duplicate, missing, mismatched and fake successful cases are refused",()=>{
 const full=report();
 assert.throws(()=>makeBaseline({...full,actualModelCalls:20,actualAnswers:full.actualAnswers.slice(0,20)}),/cobertura completa/);
 assert.throws(()=>makeBaseline({...full,actualAnswers:[...full.actualAnswers.slice(0,-1),full.actualAnswers[0]]}),/duplicado/);
 assert.throws(()=>makeBaseline({...full,actualAnswers:full.actualAnswers.map((x,i)=>i===5?{...x,id:"Z-999"}:x)}),/ausente|desconocido/);
 assert.throws(()=>makeBaseline({...full,actualAnswers:full.actualAnswers.map((x,i)=>i===5?{...x,kind:"memory"}:x)}),/categoría incorrecta/);
 assert.throws(()=>makeBaseline({...full,actualAnswers:full.actualAnswers.map((x,i)=>i===5?{...x,critical:["bullying"]}:x)}),/no puede pasar/);
 assert.throws(()=>makeBaseline({...full,actualAnswers:full.actualAnswers.map((x,i)=>i===5?{...x,pass:"yes"}:x)}),/inválido/);
});
