import test from "node:test";
import assert from "node:assert/strict";
import {nextYaw} from "../src/camera-input.js";
import {readSetting,writeSetting} from "../src/settings.js";
test("WEB-002: camera input pure and clamps yaw",()=>{
 assert.equal(nextYaw(0,"ArrowLeft"),.22);
 assert.equal(nextYaw(0,"ArrowRight"),-.22);
 assert.equal(nextYaw(1.36,"ArrowLeft"),1.4);
 assert.equal(nextYaw(-1.36,"ArrowRight"),-1.4);
});
test("WEB-002: settings store degrades gracefully",()=>{
 const map=new Map(),store={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 writeSetting("provider","local",store);
 assert.equal(readSetting("provider",store),"local");
 assert.equal(readSetting("provider",{getItem(){throw Error("blocked");}}),null);
});
