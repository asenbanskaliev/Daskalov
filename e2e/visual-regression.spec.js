import {mkdir} from "node:fs/promises";
import {test,expect} from "@playwright/test";
test("GFX-009: reproducible keyboard lesson visual frame at desktop and mobile",async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/");
 await page.getByRole("button",{name:"Matemáticas"}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("tizas");
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:844});
  const area=page.locator("#lessonPanel");
  await expect(area).toBeVisible();
  await mkdir("reports/visual-review",{recursive:true});
  const a=await area.screenshot({
   animations:"disabled",
   path:"reports/visual-review/"+testInfo.project.name+"-lesson-"+width+".png"
  });
  const b=await area.screenshot({animations:"disabled"});
  expect(a.byteLength).toBeGreaterThan(1000);
  expect(a.equals(b)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBe(true);
 }
});
