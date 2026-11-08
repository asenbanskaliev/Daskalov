import test from "node:test";
import assert from "node:assert/strict";
import {comparePerformance} from "../scripts/performance-comparator.mjs";
const before={schema:"daskalov-hardware-perf-v1",sha:"a".repeat(40),browser:"Chrome",deviceTier:"low",quality:"low",resolution:"1280x720",
 benchmarkId:"classroom-5m",durationMs:300000,samples:600,fpsP05:28,fpsP50:42,firstAudioP50Ms:2100};
const after={...before,sha:"b".repeat(40),fpsP05:32,fpsP50:55,firstAudioP50Ms:2000};
test("PERF-008: compare five minute profiles from same browser, profile and benchmark without falsifying approval",()=>{
 const result=comparePerformance(before,after);
 assert.equal(result.deltaFpsP50,13);
 assert.equal(result.deltaFpsP05,4);
 assert.equal(result.deltaFirstAudioP50Ms,-100);
 assert.equal(result.fpsP50RegressionGreaterThan5Percent,false);
 assert.equal(result.releaseApproved,false);
 assert.equal(result.independentHardwareEvidenceVerified,false);
 assert.ok(!JSON.stringify(result).includes("serialNumber"));
});
test("PERF-008: fail closed for short, unpaired or malformed runs and report material regressions",()=>{
 assert.throws(()=>comparePerformance({...before,durationMs:2000},after),/5 minutos/);
 assert.throws(()=>comparePerformance(before,{...after,browser:"Firefox"}),/distinto/);
 assert.throws(()=>comparePerformance(before,{...after,sha:before.sha}),/distintos/);
 const degraded=comparePerformance(before,{...after,fpsP50:30,firstAudioP50Ms:3000});
 assert.equal(degraded.fpsP50RegressionGreaterThan5Percent,true);
 assert.equal(degraded.audioP50RegressionGreaterThan10Percent,true);
});
