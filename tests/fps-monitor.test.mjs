import test from "node:test";
import assert from "node:assert/strict";
import {FpsMonitor} from "../src/fps-monitor.js";
test("PERF-002/003: browser FPS monitor measures samples and remains bounded",()=>{
 const fps=new FpsMonitor({maxSamples:100});
 fps.observe(0);
 for(let i=1;i<=120;i++)fps.observe(i*20);
 const snap=fps.snapshot();
 assert.equal(snap.samples,100);
 assert.equal(snap.fpsP50,50);
 assert.equal(snap.fpsP05,50);
 assert.equal(snap.measuredInBrowser,true);
 assert.ok(!JSON.stringify(snap).includes("GPU"));
});
test("PERF-002: invalid timestamp is ignored without inventing FPS",()=>{
 const fps=new FpsMonitor();
 fps.observe(Number.NaN);fps.observe(100);fps.observe(100);fps.observe(1500);
 assert.equal(fps.snapshot().samples,0);
});
