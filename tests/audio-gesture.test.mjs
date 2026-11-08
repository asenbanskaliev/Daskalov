import test from "node:test";
import assert from "node:assert/strict";
import {gestureForAudio} from "../src/audio-gesture.js";
test("AV-003: actual playback changes idle to talk, and restores idle at stop",()=>{
 assert.equal(gestureForAudio("idle",false),"idle");
 assert.equal(gestureForAudio("idle",true),"talk");
 assert.equal(gestureForAudio("idle",false),"idle");
 for(const x of ["point_board","ruler_desk","surprised","raise_hand"])assert.equal(gestureForAudio(x,true),x);
});
