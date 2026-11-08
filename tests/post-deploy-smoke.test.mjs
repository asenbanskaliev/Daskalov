import test from "node:test";
import assert from "node:assert/strict";
import {smokeDeployment} from "../scripts/post-deploy-smoke.mjs";
const mock=(path,{method="GET"}={})=>{
 const pathname=new URL(path).pathname;
 const contentType=pathname==="/"?"text/html":"application/json";
 const status=method==="POST"?403:200;
 const data=pathname==="/api/health"?{ok:true,demoOnly:true,cloudConfigured:false}:{};
 return Promise.resolve({status,ok:status===200,
  headers:{get:(name)=>name==="content-security-policy"?"default-src 'self'; script-src 'self'":name==="content-type"?contentType:null},
  json:async()=>data});
};
test("REL-005: post-deploy gate verifies health, page, HTTPS policies and blocked public demo APIs",async()=>{
 const result=await smokeDeployment({url:"https://example.org",expectDemo:true,fetchImpl:mock});
 assert.equal(result.demoIsolation,true);
 await assert.rejects(()=>smokeDeployment({url:"https://user:pass@example.org",fetchImpl:mock}),/inválida/);
 await assert.rejects(()=>smokeDeployment({url:"file:///tmp/a",fetchImpl:mock}),/inválida/);
});
test("REL-005: demo smoke fails closed on API exposure",async()=>{
 const exposing=(u,opts)=>mock(u,opts).then(r=>new URL(u).pathname==="/api/chat"?{...r,status:200}:r);
 await assert.rejects(()=>smokeDeployment({url:"https://example.org",expectDemo:true,fetchImpl:exposing}),/permite acceso/);
 const leakedHealth=(u,opts)=>mock(u,opts).then(r=>new URL(u).pathname==="/api/health"?{...r,json:async()=>({ok:true,demoOnly:false,cloudConfigured:true})}:r);
 await assert.rejects(()=>smokeDeployment({url:"https://example.org",expectDemo:true,fetchImpl:leakedHealth}),/no aislado/);
});
