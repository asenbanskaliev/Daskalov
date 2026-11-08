import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";
import {LESSONS,LEVELS,lessonForLevel} from "../src/game.js";

test("VAL-01: complete browser-to-real-Node safety turn reaches transcript without model credentials",async({page})=>{
 let streamCalls=0;
 await page.route("**/api/chat/stream",route=>{streamCalls++;return route.continue();});
 await page.goto("/");
 await withSettings(page,()=>page.locator("#ttsMode").selectOption("disabled"));
 await page.locator("#question").fill("Me hacen bullying en clase");
 await page.locator("#sendButton").click();
 await expect(page.locator("#history")).toContainText("adulto de confianza");
 await expect(page.locator("#speechBubble")).toContainText("adulto de confianza");
 expect(streamCalls).toBe(1,"This is the real backend deterministic safety response, not a mocked stream.");
 const session=await page.request.get("/api/session");
 expect(session.ok()).toBe(true);
 expect((await session.json()).active).toBe(false);
});

test("VAL-03: renderer emits real browser counters or declares WebGL unavailable, never fake GPU VRAM",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");
 const status=page.locator("#sceneStatus");
 await expect(status).toContainText(/personaje GLB local cargado|3D no disponible/,{timeout:15000});
 if((await status.innerText()).includes("3D no disponible")){
  await expect(page.locator("#question")).toBeVisible();
  await page.getByRole("button",{name:"Historia",exact:true}).click();
  await expect(page.locator("#lessonQuestion")).toBeVisible();
  return;
 }
 await page.waitForTimeout(1000);
 await page.locator("#settingsToggle").click();
 await page.locator("#devMetrics summary").click();
 await page.locator("#refreshMetrics").click();
 const report=JSON.parse(await page.locator("#devMetricsJson").innerText());
 const gpu=report.localBrowserGraphics;
 expect(gpu.measuredInBrowser).toBe(true);
 expect(gpu.samples).toBeGreaterThan(5);
 expect(gpu.fpsP50).toBeGreaterThan(0);
 expect(gpu.drawCallsLastFrame).toBeGreaterThan(0);
 expect(gpu.geometries).toBeGreaterThan(0);
 expect(gpu.staticBakedVertexLighting).toBe(true);
 expect(gpu.hardwareMeasurement).toBe(false);
 expect(gpu.limitations).toContain("VRAM");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);
});

for(const level of LEVELS){
 test("VAL-04: independently executable lessons for "+level,async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  // Pedagogy test does not need GPU resources; 3D is validated separately.
  await page.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){
    if(String(type).startsWith("webgl"))return null;
    return original.call(this,type,...args);
   };
  });
  await page.goto("/");
  await page.locator("#lessonDifficulty").selectOption(level);
  for(const lesson of LESSONS){
   const expected=lessonForLevel(lesson.id,level);
   const pick=page.getByRole("button",{name:lesson.title,exact:true});
   await pick.click();
   await expect(page.locator("#lessonQuestion")).toContainText(expected.question);
   await page.locator("#lessonAnswers").getByRole("button",{name:expected.answer,exact:true}).click();
   await expect(page.locator("#lessonFeedback")).toContainText(expected.explanation);
  }
  await expect(page.locator("#gameProgress")).toContainText("3 de 3");
 });
}

test("VAL-05: no memory, microphone, public-cloud audio or model calls in a demo for a minor",async({page})=>{
 let chatCalls=0,ttsCalls=0,sttCalls=0;
 await page.route("**/api/chat*",route=>{chatCalls++;return route.abort();});
 await page.route("**/api/tts/**",route=>{ttsCalls++;return route.abort();});
 await page.route("**/api/stt/cloud",route=>{sttCalls++;return route.abort();});
 await page.goto("/");
 await expect(page.locator("#remember")).toBeDisabled();
 await expect(page.locator("#voiceEnabled")).not.toBeChecked();
 await withSettings(page,()=>page.locator("#provider").selectOption("demo"));
 await expect(page.locator("#remember")).not.toBeChecked();
 await withSettings(page,()=>page.locator("#sttMode").selectOption("disabled"));
 await expect(page.locator("#micButton")).toBeDisabled();
 await page.locator("#question").fill("¿Qué es la historia?");
 await page.locator("#sendButton").click();
 await expect(page.locator("#history")).toContainText("La historia");
 expect([chatCalls,ttsCalls,sttCalls]).toEqual([0,0,0]);
 const session=await page.request.get("/api/session");
 expect((await session.json()).memoryAvailable).toBe(false);
 const activation=await page.request.post("/api/session",{data:{}});
 expect(activation.status()).toBe(403);
 const cloudAudio=await page.request.post("/api/stt/cloud",{data:Buffer.from("not audio"),headers:{"content-type":"audio/wav"}});
 expect(cloudAudio.status()).toBe(403);
});
