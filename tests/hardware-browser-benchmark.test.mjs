import test from "node:test";
import assert from "node:assert/strict";
import {summarizeHardwareFps,collectLocalHardwareFps} from "../scripts/hardware-browser-benchmark.mjs";
const common={sha:"a".repeat(40),browser:"chrome",deviceTier:"normal",quality:"low",resolution:"1280x720",durationMs:300000};
test("PERF-003: real-frame summary matches 5-minute comparator schema with no fabricated approvals",()=>{
 const sample=summarizeHardwareFps({...common,frames:Array(300).fill(1000/60)});
 assert.equal(sample.schema,"daskalov-hardware-perf-v1");
 assert.equal(sample.fpsP50,60);assert.equal(sample.fpsP05,60);
 assert.equal(sample.renderTargetObserved,true);assert.equal(sample.renderBudgetTargetFps,55);
 assert.equal(sample.independentHardwareEvidenceVerified,false);
 assert.equal(sample.firstAudioP50Ms,null);
 const low=summarizeHardwareFps({...common,frames:Array(200).fill(1000/25),deviceTier:"low"});
 assert.equal(low.renderTargetObserved,false);assert.equal(low.renderBudgetTargetFps,30);
});
test("PERF-003: short, invalid frames or missing consent cannot launch a browser",async()=>{
 assert.throws(()=>summarizeHardwareFps({...common,durationMs:1000,frames:Array(100).fill(16)}),/cinco minutos/);
 assert.throws(()=>summarizeHardwareFps({...common,frames:Array(100).fill(0)}),/incorrectos/);
 assert.throws(()=>summarizeHardwareFps({...common,frames:Array(100).fill(16),sha:"unknown"}),/SHA/);
 await assert.rejects(()=>collectLocalHardwareFps({...common,consent:"0"}),/autorización/);
});
