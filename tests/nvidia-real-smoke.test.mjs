import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateNvidiaLive} from "../scripts/nvidia-real-smoke-ci.mjs";
test("AI-012: NVIDIA real smoke makes precisely two synthetic calls and outputs no response",async()=>{
 let calls=0;
 const result=await validateNvidiaLive({
  key:"nvapi-mocked-key",
  chat:async ({provider})=>{assert.equal(provider,"nvidia");calls++;return "Respuesta que jamás se debe mostrar";},
  stream:async function*({provider}){assert.equal(provider,"nvidia");calls++;yield "Respuesta ";yield "secreta";}
 });
 assert.equal(calls,2);assert.equal(result.realProviderRequests,2);
 assert.equal(result.rawRepliesExcluded,true);
 assert.doesNotMatch(JSON.stringify(result),/Respuesta/);
});
test("AI-012: no credential, no remote calls",async()=>{
 let calls=0;
 await assert.rejects(()=>validateNvidiaLive({key:"",chat:async()=>{calls++}}),/SECRET/);
 assert.equal(calls,0);
});
test("AI-012: secret used only by marker-only branch push (no PR)",()=>{
 const yaml=readFileSync(".github/workflows/nvidia-real-smoke.yml","utf8");
 assert.match(yaml,/secrets\.NVIDIA_API_KEY/);
 assert.match(yaml,/paths:\s*\n\s+- "odd\/evidence\/nvidia-smoke\.trigger"/);
 assert.match(yaml,/github\.ref == 'refs\/heads\/feat\/odd-tdd-web-mvp'/);
 assert.match(yaml,/persist-credentials: false/);
 assert.doesNotMatch(yaml,/^\s*(pull_request|pull_request_target|schedule|workflow_dispatch|workflow_run):/m);
 assert.doesNotMatch(yaml,/git push|npm publish|write-all/);
});
