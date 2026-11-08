import test from "node:test";
import assert from "node:assert/strict";
import {MetricsCollector} from "../server/metrics.mjs";
test("AI-011: external provider metrics are anonymous; external billing is unknown",()=>{
 const metrics=new MetricsCollector({cloudUsdPerMillionOutputTokens:100});
 metrics.record({provider:"openrouter",ok:true,durationMs:700,firstTokenMs:150,outputChars:130});
 metrics.record({provider:"nvidia",ok:true,durationMs:950,firstTokenMs:200,outputChars:80});
 const result=metrics.snapshot();
 assert.equal(result.providers.openrouter.requests,1);
 assert.equal(result.providers.nvidia.requests,1);
 assert.equal(result.providers.openrouter.durationP50Ms,700);
 assert.equal(result.providers.nvidia.costUsdEstimated,null);
 assert.equal(result.providers.openrouter.costUsdEstimated,null);
 assert.equal(result.scope,"anonymous-aggregate");
 assert.doesNotMatch(JSON.stringify(result),/Authorization|Bearer|sk-or-/);
});
