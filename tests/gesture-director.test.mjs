import test from "node:test";
import assert from "node:assert/strict";
import {ALLOWED_GESTURES,GestureDirector} from "../src/gesture-director.js";
test("AV-005: only authorized gestures; player interrupts ambient, ambient cannot override lesson",()=>{
 let now=0;const director=new GestureDirector({now:()=>now});
 assert.ok(ALLOWED_GESTURES.includes("ruler_desk"));
 assert.equal(director.propose("inject:script",{source:"llm"}),false);
 assert.equal(director.propose("talk",{source:"ambient"}),true);
 assert.equal(director.propose("point_board",{source:"lesson"}),true);
 assert.equal(director.propose("ruler_desk",{source:"ambient"}),false);
 assert.equal(director.current(),"point_board");
 assert.equal(director.propose("raise_hand",{source:"player"}),true);
 assert.equal(director.propose("surprised",{source:"llm"}),false);
 now=2500;assert.equal(director.current(),"idle");
 assert.equal(director.propose("surprised",{source:"llm"}),true);
 director.clear();assert.equal(director.current(),"idle");
});
test("AV-005: durations capped, invalid sources rejected, safety wins",()=>{
 let now=10;const d=new GestureDirector({now:()=>now});
 assert.equal(d.propose("idle",{source:"untrusted"}),false);
 assert.equal(d.propose("surprised",{source:"safety",durationMs:999999}),true);
 assert.equal(d.propose("talk",{source:"player"}),false);
 now=5011;assert.equal(d.current(),"idle");
});
