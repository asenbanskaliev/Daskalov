import test from "node:test";
import assert from "node:assert/strict";
import {VoiceMetrics} from "../src/voice-metrics.js";
test("PERF-001: time to first audible TTS, real-time factor and gaps",()=>{
 let now=100;const metrics=new VoiceMetrics({now:()=>now,limit:5});
 metrics.beginTurn();now=420;metrics.audioStart();
 metrics.fragment({audioStartMs:2000,durationMs:500,synthesisMs:250});
 metrics.fragment({audioStartMs:2580,durationMs:500,synthesisMs:100});
 const report=metrics.snapshot();
 assert.equal(report.firstAudioMs.p50,320);
 assert.equal(report.ttsRealTimeFactor.samples,2);
 assert.equal(report.audioGapMs.p95,80);
 assert.equal(report.storedText,false);
});
test("PERF-001: cancellation and bounded anonymous aggregates",()=>{
 let now=0;const m=new VoiceMetrics({now:()=>now,limit:3});
 m.beginTurn();m.cancel();
 assert.equal(m.snapshot().cancelledBeforeFirstAudio,1);
 for(let i=0;i<10;i++){m.beginTurn();now+=10;m.audioStart();}
 assert.equal(m.snapshot().firstAudioMs.samples,3);
 assert.doesNotMatch(JSON.stringify(m.snapshot()),/email|transcript|ipAddress|playerId/);
});
