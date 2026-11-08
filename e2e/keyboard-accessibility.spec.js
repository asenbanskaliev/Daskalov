import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";
test("WEB-007: three educational activities work with keyboard, reduced motion, no mic and no WebGL",async({page})=>{
 await page.setViewportSize({width:320,height:720});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.addInitScript(()=>{
  const old=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(String(type).startsWith("webgl"))return null;
   return old.call(this,type,...args);
  };
  Object.defineProperty(window,"SpeechRecognition",{value:undefined,configurable:true});
  Object.defineProperty(window,"webkitSpeechRecognition",{value:undefined,configurable:true});
 });
 await page.goto("/");
 await expect(page.locator("#sceneStatus")).toContainText("3D no disponible");
 await page.keyboard.press("Tab");await expect(page.locator(".skip-link")).toBeFocused();
 await page.keyboard.press("Enter");await expect(page.locator("#question")).toBeFocused();
 await withSettings(page,()=>page.locator("#provider").selectOption("demo"));
 await withSettings(page,()=>page.locator("#sttMode").selectOption("disabled"));
 await expect(page.locator("#micButton")).toBeDisabled();
 await page.locator("#question").fill("¿Qué es la historia?");
 await page.keyboard.press("Enter");
 await expect(page.locator("#history")).toContainText("La historia");
 const subjects=["Matemáticas","Lengua","Historia"];
 for(const subject of subjects){
  const button=page.getByRole("button",{name:subject,exact:true}).first();
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#lessonQuestion")).toBeVisible();
  const answer=page.locator("#lessonAnswers button").first();
  await answer.focus();await page.keyboard.press("Enter");
  await expect(page.locator("#lessonFeedback")).not.toBeEmpty();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);
});
