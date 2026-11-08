import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("SEC-001/SAFE-007: paid Cloud probe never prints raw exception text or user prompts",()=>{
 const script=readFileSync("scripts/ollama-cloud-smoke.mjs","utf8");
 assert.match(script,/const category=/);
 assert.match(script,/integration-error/);
 assert.doesNotMatch(script,/console\.(?:error|log)\([^;]*(?:error\.message|error\.stack|json\.error)/);
 assert.doesNotMatch(script,/console\.log\([^;]*(?:reply\.reply|messages)/);
});
