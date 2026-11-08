import test from "node:test";
import assert from "node:assert/strict";
import {smokeRemoteProvider} from "../scripts/remote-provider-smoke.mjs";
const mock=async(url)=>{
 if(url.endsWith("/models"))return Response.json({data:[{id:"deepseek/deepseek-chat:free"}]});
 return Response.json({choices:[{message:{content:"Buenos días, clase"}}]});
};
test("AI-011: real vendor smoke uses exactly one synthetic chat, no raw content or secrets",async()=>{
 let calls=0;
 const r=await smokeRemoteProvider({provider:"openrouter",model:"deepseek/deepseek-chat:free",apiKey:"sk-or-v1-synthetic",
  env:{DASKALOV_REMOTE_SMOKE_CONSENT:"1"},now:(()=>{let time=0;return()=>{time+=45;return time;};})(),
  fetchImpl:async(url,opts)=>{calls++;return mock(url,opts);}
 });
 assert.equal(calls,2,"one catalog and one inference request");
 assert.equal(r.requestCount,1);
 assert.equal(r.success,true);
 assert.equal(r.latencyMs,45);
 assert.equal(r.responseCharacters,17);
 assert.equal(r.rawResponseIncluded,false);
 assert.equal(r.credentialsStored,false);
 assert.doesNotMatch(JSON.stringify(r),/sk-or-v1|Buenos días/);
});
test("AI-011: smoke cannot contact paid vendor without consent or valid catalog entry",async()=>{
 let called=0;
 await assert.rejects(()=>smokeRemoteProvider({provider:"openrouter",model:"deepseek/deepseek-chat:free",apiKey:"sk-or-v1-test",
  env:{},fetchImpl:async()=>{called++;throw Error("remote call");}}),/consentimiento/);
 assert.equal(called,0);
 await assert.rejects(()=>smokeRemoteProvider({provider:"openrouter",model:"wrong/model",apiKey:"sk-or-v1-test",
  env:{DASKALOV_REMOTE_SMOKE_CONSENT:"1"},fetchImpl:mock}),/Modelo no confirmado/);
});
