import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("AULA-001: no duplicate app controls, fullscreen targets main and settings uses modal semantics",()=>{
 const html=readFileSync("index.html","utf8");
 for(const id of ["mainContent","sceneCanvas","question","history","settingsDrawer","settingsClose","settingsToggle","lessonsToggle","historyToggle","fullscreenToggle","activityHub","lessonPanel","provider","model","graphicsQuality","micButton","sendButton"]){
  assert.equal(html.split('id="'+id+'"').length-1,1,id+" must be unique");
 }
 assert.match(html,/id="settingsDrawer"[^>]*role="dialog"[^>]*aria-modal="true"/);
 assert.match(html,/id="drawerBackdrop"[^>]*hidden/);
 const js=readFileSync("src/aula-mode.js","utf8");
 assert.match(js,/layout\.requestFullscreen\(\)/);
 assert.match(js,/documentRef\.fullscreenElement===layout/);
 assert.match(js,/documentRef\.exitFullscreen\(\)/);
 assert.match(js,/classList\.toggle\("is-immersive"/);
 assert.match(js,/stage\.inert=true/);
 assert.doesNotMatch(js,/writeSetting\(|localStorage|sessionStorage|fetch\(/);
});
test("AULA-002: Chat and lesson controls remain outside configuration drawer",()=>{
 const html=readFileSync("index.html","utf8");
 const start=html.indexOf('id="settingsDrawer"');
 const chat=html.indexOf('id="chatForm"'),lessons=html.indexOf('id="lessonPanel"');
 const settings=html.indexOf('id="settingsForm"');
 assert.ok(chat>=0&&chat<start);
 assert.ok(lessons>=0&&lessons<start);
 assert.ok(settings>start);
});
