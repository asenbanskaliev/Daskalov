import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateNvidiaLive,pickNvidiaModel,candidateNvidiaModels,probeNvidiaCandidates} from "../scripts/nvidia-real-smoke-ci.mjs";
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
test("AI-012: paid NVIDIA secret is available only to approved main workflow and protected Environment",()=>{
 const yaml=readFileSync(".github/workflows/nvidia-real-smoke.yml","utf8");
 assert.match(yaml,/workflow_dispatch:/);
 assert.match(yaml,/inputs\.confirm_paid_test == true/);
 assert.match(yaml,/environment: daskalov-cloud-test/);
 assert.match(yaml,/github\.ref == 'refs\/heads\/main'/);
 assert.match(yaml,/secrets\.DASKALOV_ENV_NVIDIA_API_KEY/);
 assert.doesNotMatch(yaml,/secrets\.NVIDIA_API_KEY/);
 assert.doesNotMatch(yaml,/^\s*(push|pull_request|pull_request_target|schedule|workflow_run):/m);
 assert.match(yaml,/persist-credentials: false/);
});
test("AI-012: live probe selects only a catalog-listed suitable chat model",()=>{
 assert.equal(pickNvidiaModel(["retired/obsolete","nvidia/nemotron-3-super-120b-a12b","deepseek-ai/deepseek-v4-flash"]),"deepseek-ai/deepseek-v4-flash");
 assert.equal(pickNvidiaModel(["meta/llama-3.3-70b-instruct"]),"meta/llama-3.3-70b-instruct");
 assert.equal(pickNvidiaModel(["unknown/image-model"]),null);
 assert.equal(pickNvidiaModel(["bad//path"]),null);
});

test("AI-012: at most four real catalog candidates, no retries on auth/quota or streaming failure",async()=>{
 const ids=["meta/llama-3.3-70b-instruct","openai/gpt-oss-120b","deepseek-ai/deepseek-v4-flash",
  "nvidia/nemotron-3-super-120b-a12b","other/last-instruct"];
 assert.equal(candidateNvidiaModels(ids).length,4);
 let attempts=0;
 const out=await probeNvidiaCandidates({key:"nvapi-mocked-key",models:ids,run:async({model})=>{
  attempts++;
  if(attempts<3)throw Error("HTTP 410 retired model");
  return {provider:"nvidia",model,realProviderRequests:2};
 }});
 assert.equal(attempts,3);assert.equal(out.candidateAttempts,3);assert.equal(out.unavailableModels,2);
 await assert.rejects(()=>probeNvidiaCandidates({key:"nvapi-mocked-key",models:ids,
  run:async()=>{attempts++;throw Error("HTTP 429 quota");}}),/429/);
 assert.equal(attempts,4,"quota denial stops without trying another candidate");
});
