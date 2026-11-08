import test from "node:test";
import assert from "node:assert/strict";
import {contrastRatio,rgbChannels} from "../src/contrast-ratio.js";
test("WEB-007: WCAG ratio calibrated to black/white 21:1 and equal tones 1:1",()=>{
 assert.ok(Math.abs(contrastRatio("rgb(0, 0, 0)","rgb(255, 255, 255)")-21)<.001);
 assert.equal(contrastRatio("rgb(20,20,20)","rgb(20,20,20)"),1);
 assert.deepEqual(rgbChannels("rgb(255, 0, 10)"),[255,0,10]);
 assert.throws(()=>contrastRatio("rgba(10,20,30,0.5)","rgb(0,0,0)"),/translúcidos/);
});
