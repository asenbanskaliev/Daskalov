import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateKeyPairSync,sign} from "node:crypto";
import {EXPECTED_TASKS,REQUIRED_RELEASE_GATES,parseChecklist,signedPayload,evaluateReleaseGate} from "../scripts/full-release-gate.mjs";
const plan=readFileSync("odd/tasks/implementacion-full-odd-tdd.md","utf8");
const sha="a".repeat(40);
const keys=generateKeyPairSync("ed25519",{publicKeyEncoding:{type:"spki",format:"pem"},privateKeyEncoding:{type:"pkcs8",format:"pem"}});
const fullPlan=plan.replace(/^- \[ \] \*\*(S\d{2}\.\d{2})\*\*/gm,"- [x] **$1**");
function signed(gates=REQUIRED_RELEASE_GATES.map(name=>({name,status:"passed",evidence:"https://github.com/review/"+name}))){
 const record={sha,reviewer:"External Review Board",issuedAt:new Date().toISOString(),gates};
 return {...record,signature:sign(null,signedPayload(record),keys.privateKey).toString("base64")};
}
test("REL-007: baseline checklist has 109 unique tasks and remains not FULL",()=>{
 const data=parseChecklist(plan);
 assert.equal(data.total,EXPECTED_TASKS);assert.equal(data.duplicateIds,0);
 const result=evaluateReleaseGate({plan,sha,attestation:signed(),publicKey:keys.publicKey});
 assert.equal(result.ready,false);assert.ok(result.reasons.some(x=>x.includes("tareas ODD")));
});
test("REL-007: 109 checked without a signed independent review is insufficient",()=>{
 const result=evaluateReleaseGate({plan:fullPlan,sha,attestation:null,publicKey:null});
 assert.equal(result.completed,109);assert.equal(result.ready,false);
});
test("REL-007: authenticated signed gates at exact SHA pass",()=>{
 assert.equal(evaluateReleaseGate({plan:fullPlan,sha,attestation:signed(),publicKey:keys.publicKey}).ready,true);
});
test("REL-007: forged signature, incomplete gates, duplicate ID, wrong SHA are rejected",()=>{
 const approval=signed();
 assert.equal(evaluateReleaseGate({plan:fullPlan,sha:"b".repeat(40),attestation:approval,publicKey:keys.publicKey}).ready,false);
 assert.equal(evaluateReleaseGate({plan:fullPlan,sha,attestation:signed(REQUIRED_RELEASE_GATES.slice(1).map(name=>({name,status:"passed",evidence:"https://github.com/"+name}))),publicKey:keys.publicKey}).ready,false);
 assert.equal(evaluateReleaseGate({plan:fullPlan,sha,attestation:{...approval,signature:"AA=="},publicKey:keys.publicKey}).ready,false);
 assert.equal(evaluateReleaseGate({plan:fullPlan+"\n- [x] **S01.01** duplicada\n",sha,attestation:approval,publicKey:keys.publicKey}).ready,false);
});
