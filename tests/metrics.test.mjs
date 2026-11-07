import test from "node:test";
import assert from "node:assert/strict";
import {MetricsCollector} from "../server/metrics.mjs";
test("LLM-010: aggregated telemetry has latency percentiles and no transcript/IP",()=>{
 const metrics=new MetricsCollector({cloudUsdPerMillionOutputTokens:2,retainedSamples:10});
 for(let i=0;i<100;i++)metrics.record({provider:"cloud",ok:true,durationMs:i*10,firstTokenMs:100+i,outputChars:20});
 metrics.record({provider:"local",cancelled:true,durationMs:35});
 const s=metrics.snapshot();
 assert.equal(s.providers.cloud.requests,100);
 assert.equal(s.providers.cloud.outputTokensEstimated,500);
 assert.ok(s.providers.cloud.durationP95Ms>=900);
 assert.ok(s.providers.cloud.costUsdEstimated>0);
 assert.equal(s.providers.local.cancelled,1);
 const text=JSON.stringify(s);
 assert.ok(!text.includes("studentId"));
 assert.ok(!text.includes("192.168."));
 assert.ok(!text.includes("pregunta del alumno"));
});
test("LLM-010: without configured pricing cost is unknown, never claimed zero",()=>{
 const s=new MetricsCollector().snapshot();
 assert.equal(s.providers.cloud.costUsdEstimated,null);
 assert.equal(s.providers.local.durationP95Ms,null);
});
