import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";

/** Non-LLM branded browser smoke; no credentials, real audio, or personal data. */
for(const view of [{width:1280,height:800},{width:390,height:844}]){
 test("REL-002: brand browser text classroom and keyboard at "+view.width,async({page})=>{
  await page.setViewportSize(view);
  await page.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    if(String(kind).startsWith("webgl"))return null;
    return original.call(this,kind,...args);
   };
  });
  await page.goto("/");
  await expect(page.locator("#question")).toBeVisible();
  await expect(page.locator("#sceneStatus")).toContainText("3D no disponible");
  await withSettings(page,()=>page.locator("#provider").selectOption("demo"));
  await page.locator("#question").fill("¿Qué es la historia?");
  await page.locator("#sendButton").click();
  await expect(page.locator("#history")).toContainText("La historia");
  await expect(page.locator("#speechBubble")).toContainText("«");
  await expect(page.locator("#micButton")).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);
 });
}
