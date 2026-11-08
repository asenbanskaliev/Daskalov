import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";
for(const width of [320,390]){
 test("WEB-007: controls remain usable and no horizontal overflow at narrow viewport "+width,async({page})=>{
  await page.setViewportSize({width,height:700});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  for(const selector of ["#sendButton","#micButton","#pauseVoice","#resumeVoice"]){
   const rect=await page.locator(selector).boundingBox();
   expect(rect,selector+" visible").not.toBeNull();
   expect(rect.width,selector+" width").toBeGreaterThanOrEqual(24);
   expect(rect.height,selector+" height").toBeGreaterThanOrEqual(24);
  }
  await page.locator("#settingsToggle").click();
  for(const selector of ["#forgetButton","#viewMemories","#exportMemories"]){
   const rect=await page.locator(selector).boundingBox();
   expect(rect,selector+" in settings").not.toBeNull();
   expect(rect.width).toBeGreaterThanOrEqual(24);
   expect(rect.height).toBeGreaterThanOrEqual(24);
  }
  await page.locator("#settingsClose").click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);
  await withSettings(page,()=>page.locator("#provider").selectOption("demo"));
  await page.getByRole("button",{name:"Matemáticas"}).click();
  await expect(page.locator("#lessonQuestion")).toContainText("tizas");
  const lessonButton=await page.locator("#lessonAnswers button").first().boundingBox();
  expect(lessonButton.height).toBeGreaterThanOrEqual(24);
 });
}
