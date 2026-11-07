import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
test("WEB-002 RED: separate modules for scene, input, provider, memory, and UI",()=>{
 for(const filename of ["src/scene.js","src/camera-input.js","src/settings.js","src/memory-ui.js","src/voice-input.js","src/dom-ui.js"]){
  assert.equal(existsSync(filename),true,"Missing module: "+filename);
 }
 const entry=readFileSync("src/app.js","utf8");
 for(const name of ["./scene.js","./camera-input.js","./settings.js","./memory-ui.js","./voice-input.js","./dom-ui.js"])assert.ok(entry.includes(name),name+" not imported");
 assert.ok(entry.length<7600,"Entrypoint must focus on orchestration, not embed rendering.");
});
