import test from "node:test";
import assert from "node:assert/strict";
import {AdaptiveQuality} from "../src/performance-profile.js";
test("GFX-008: quality auto reduces resolution under sustained slow rendering",()=>{
 const q=new AdaptiveQuality({initial:1.25,window:10});
 for(let i=0;i<9;i++)assert.equal(q.sample(50),null);
 const result=q.sample(50);
 assert.ok(result.changed);assert.ok(result.ratio<1.25);
});
test("GFX-008: quality adapts up only after stable fast samples and respects limits",()=>{
 const q=new AdaptiveQuality({initial:1.4,max:1.5,min:.7,window:10});
 for(let cycle=0;cycle<10;cycle++)for(let i=0;i<10;i++)q.sample(10);
 assert.equal(q.ratio,1.5);
 for(let cycle=0;cycle<40;cycle++)for(let i=0;i<10;i++)q.sample(80);
 assert.equal(q.ratio,.7);
});
