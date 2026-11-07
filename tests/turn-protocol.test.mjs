import test from "node:test";
import assert from "node:assert/strict";
import {makeTurnEvent,validateTurnEvent,TURN_SCHEMA_VERSION} from "../shared/turn-protocol.js";
import {isPrivateHost,UsageBudget} from "../server/access-policy.mjs";
test("LLM-001: schema tipado compartido, requestId, versión y monotonía",()=>{
 const a=makeTurnEvent({type:"started",requestId:"turn-1",sequence:0});
 assert.equal(a.schemaVersion,TURN_SCHEMA_VERSION);
 assert.throws(()=>validateTurnEvent({...a,schemaVersion:2}),/Versión/);
 assert.throws(()=>validateTurnEvent({...a,sequence:2},{previousSequence:0}),/secuencia/);
 assert.throws(()=>validateTurnEvent({...a,requestId:"otro"},{previousSequence:-1,requestId:"turn-1"}),/otra conversación/);
 assert.throws(()=>makeTurnEvent({type:"gesture",requestId:"turn-1",sequence:1,animation:"eval"}),/Gesto/);
 assert.equal(makeTurnEvent({type:"gesture",requestId:"turn-1",sequence:1,animation:"ruler_desk"}).type,"gesture");
});
test("SEC-005: Cloud rechaza host no local y protege presupuesto agregado",()=>{
 assert.equal(isPrivateHost("localhost:3000"),true);
 assert.equal(isPrivateHost("127.0.0.1:3000"),true);
 assert.equal(isPrivateHost("daskalov.example"),false);
 assert.equal(isPrivateHost("localhost.example:3000"),false);
 const budget=new UsageBudget({dailyLimit:2});
 assert.equal(budget.reserve(new Date("2026-11-07T12:00:00Z")),true);
 assert.equal(budget.reserve(new Date("2026-11-07T12:00:01Z")),true);
 assert.equal(budget.reserve(new Date("2026-11-07T12:00:02Z")),false);
 assert.equal(budget.reserve(new Date("2026-11-08T12:00:00Z")),true);
});
