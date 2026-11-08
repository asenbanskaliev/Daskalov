import {test,expect} from "@playwright/test";
import {contrastRatio} from "../src/contrast-ratio.js";
test("WEB-007: readable controls and message have at least 4.5:1 measured contrast",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:"Matemáticas"}).click();
 for(const selector of ["#question","#sendButton","#speechBubble","#lessonAnswers button",".message.assistant",".secondary"]){
  const node=page.locator(selector).first();
  await expect(node).toBeVisible();
  const colors=await node.evaluate(el=>{
   const s=getComputedStyle(el);
   return {foreground:s.color,background:s.backgroundColor};
  });
  const ratio=contrastRatio(colors.foreground,colors.background);
  expect(ratio,selector+" contrast").toBeGreaterThanOrEqual(4.5);
 }
});
