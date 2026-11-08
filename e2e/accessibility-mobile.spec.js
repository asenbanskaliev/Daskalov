import {test,expect} from "@playwright/test";
test("WEB-007: mobile keyboard and reduced-motion alternatives",async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 await expect(page.locator("#reducedMotion")).toBeChecked();
 await page.keyboard.press("Tab");
 await expect(page.locator(".skip-link")).toBeFocused();
 await expect(page.locator("#question")).toBeVisible();
 await page.locator("#provider").selectOption("demo");
 await page.locator("#question").fill("¿Qué es la historia?");
 await page.locator("#sendButton").click();
 await expect(page.locator("#history")).toContainText("La historia");
 const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1);
 expect(noOverflow).toBe(true);
});
test("WEB-006/007: WebGL absent keeps text lessons, subtitles and keyboard",async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(String(type).startsWith("webgl"))return null;
   return original.call(this,type,...args);
  };
 });
 await page.goto("/");
 await expect(page.locator("#sceneStatus")).toContainText("3D no disponible");
 await page.getByRole("button",{name:"Matemáticas"}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("tizas");
 await page.locator("#provider").selectOption("demo");
 await page.locator("#question").fill("Hola profesor");
 await page.locator("#sendButton").click();
 await expect(page.locator("#speechBubble")).toContainText("«");
});
