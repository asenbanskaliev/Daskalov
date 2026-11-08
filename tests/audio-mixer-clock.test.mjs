import test from "node:test";
import assert from "node:assert/strict";
import {AudioMixerClock} from "../src/audio-mixer-clock.js";
test("AV-003: speaking animation follows real WebAudio clock, pauses without frame drift",()=>{
 let ms=1000;const mixer=new AudioMixerClock();
 mixer.setClock(()=>ms);
 assert.equal(mixer.step(.016,true),0);
 ms=1040;assert.ok(Math.abs(mixer.step(.4,true)-.04)<1e-8);
 assert.equal(mixer.step(.4,true),0,"WebAudio paused; RAF must not advance speaking");
 ms=1140;assert.ok(Math.abs(mixer.step(.01,true)-.1)<1e-8);
 ms=2000;assert.equal(mixer.step(.016,true),0,"discontinuity must not seek forward");
 assert.equal(mixer.step(.016,false),.016);
 mixer.reset();assert.equal(mixer.step(.03,true),.03);
});
test("AV-003: invalid or negative audio clock delta safely clamps",()=>{
 const mixer=new AudioMixerClock();
 mixer.setClock(()=>NaN);assert.equal(mixer.step(1,true),.1);
 let time=300;mixer.setClock(()=>time);assert.equal(mixer.step(.02,true),0);
 time=100;assert.equal(mixer.step(.02,true),0);
 mixer.setClock("bad");assert.equal(mixer.step(-1,true),0);
});
