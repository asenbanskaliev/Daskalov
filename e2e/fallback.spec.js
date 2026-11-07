import {test,expect} from "@playwright/test";
const id="00000000-0000-4000-8000-000000000011";
function turn(){
 return [{type:"started",requestId:id,sequence:0},{type:"delta",requestId:id,sequence:1,text:"¡Hola!"},{type:"sentence",requestId:id,sequence:2,text:"¡Hola!"},{type:"completed",requestId:id,sequence:3,reply:"¡Hola!",animation:"talk"}].map(x=>JSON.stringify(x)).join("\n")+"\n";
}
test("LLM-006: fallback Cloud requiere marcar consentimiento y se borra al salir de local",async({page})=>{
 await page.route("**/api/models?*",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({models:["beam","qwen2.5:7b"]})}));
 const sent=[];
 await page.route("**/api/chat/stream",route=>{sent.push(route.request().postDataJSON());return route.fulfill({status:200,contentType:"application/x-ndjson",body:turn()});});
 await page.goto("/");
 await page.locator("#voiceEnabled").uncheck();
 await page.locator("#provider").selectOption("local");
 await expect(page.locator("#cloudFallbackRow")).toBeVisible();
 await expect(page.locator("#cloudFallback")).not.toBeChecked();
 await page.locator("#question").fill("Hola profesor");
 await page.locator("#sendButton").click();
 await expect.poll(()=>sent.length).toBe(1);
 expect(sent[0].allowFallbackToCloud).toBe(false);
 await page.locator("#cloudFallback").check();
 await page.locator("#question").fill("Otra pregunta");
 await page.locator("#sendButton").click();
 await expect.poll(()=>sent.length).toBe(2);
 expect(sent[1].allowFallbackToCloud).toBe(true);
 await page.locator("#provider").selectOption("cloud");
 await expect(page.locator("#cloudFallbackRow")).toBeHidden();
 await expect(page.locator("#cloudFallback")).not.toBeChecked();
});
