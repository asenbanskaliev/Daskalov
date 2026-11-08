import test from "node:test";
import assert from "node:assert/strict";
import {datasetHash,makeBaseline,compareBaseline} from "../scripts/persona-baseline.mjs";
import {PERSONA_DATASET_VERSION} from "../scripts/persona-eval-cases.mjs";
const report=(passed=true)=>({
 datasetVersion:PERSONA_DATASET_VERSION,mode:"local",model:"example-local",
 actualModelCalls:2,actualAnswers:[
  {id:"H-001",kind:"humor",pass:passed,critical:passed?[]:["bullying"]},
  {id:"E-001",kind:"academic",pass:true,critical:[]}
 ]
});
test("PERSONA-008: SHA256 dataset is deterministic and evaluation baseline is model scoped",()=>{
 const hash=datasetHash();
 assert.match(hash,/^[a-f0-9]{64}$/);assert.equal(datasetHash(),hash);
 const first=makeBaseline(report(),{sha:"a".repeat(40)});
 assert.equal(first.total,2);
 assert.equal(first.passed,2);
 assert.equal(first.model,"example-local");
 assert.equal(first.datasetSha256,hash);
 assert.equal(compareBaseline(first,makeBaseline(report())).pass,true);
});
test("PERSONA-008: regression is detected, not overwritten by mismatched models",()=>{
 const base=makeBaseline(report(true));
 const degraded=makeBaseline(report(false));
 assert.deepEqual(compareBaseline(base,degraded).regressions,["H-001"]);
 assert.equal(compareBaseline(base,degraded).pass,false);
 assert.throws(()=>compareBaseline(base,{...degraded,model:"different"}),/comparables/);
 assert.throws(()=>makeBaseline({...report(),mode:"static"}),/local real/);
 assert.throws(()=>makeBaseline({...report(),actualModelCalls:0,actualAnswers:[]}),/reales/);
});
