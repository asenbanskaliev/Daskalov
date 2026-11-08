import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";
test("VAL-02: mode Sin voz produces no speech synthesis or audio network calls",async({page})=>{
 let ttsRequests=0;
 await page.route("**/api/tts/**",route=>{ttsRequests++;return route.abort();});
 const turnId="00000000-0000-4000-8000-000000000089";
 await page.route("**/api/chat/stream",route=>route.fulfill({
  status:200,contentType:"application/x-ndjson",
  body:[
   {type:"started",requestId:turnId,sequence:0,provider:"cloud",model:"beam"},
   {type:"delta",requestId:turnId,sequence:1,text:"Buenos días, hoy aprenderemos historia."},
   {type:"sentence",requestId:turnId,sequence:2,text:"Buenos días, hoy aprenderemos historia."},
   {type:"completed",requestId:turnId,sequence:3,reply:"Buenos días, hoy aprenderemos historia.",animation:"talk",provider:"cloud",model:"beam"}
  ].map(x=>JSON.stringify(x)).join("\n")+"\n"
 }));
 await page.goto("/");
 await page.evaluate(()=>{
  window.__daskalovSynthCalls=0;
  const speech=window.speechSynthesis;
  if(speech)Object.defineProperty(speech,"speak",{configurable:true,value:()=>{window.__daskalovSynthCalls++;}});
 });
 await withSettings(page,()=>page.locator("#ttsMode").selectOption("disabled"));
 await expect(page.locator("#ttsCostInfo")).toContainText("Sin voz");
 await withSettings(page,()=>page.locator("#voiceEnabled").check());
 await page.locator("#question").fill("Hola profesor");
 await page.locator("#sendButton").click();
 await expect(page.locator("#history")).toContainText("hoy aprenderemos historia");
 expect(ttsRequests).toBe(0);
 expect(await page.evaluate(()=>window.__daskalovSynthCalls)).toBe(0);
 await page.reload();
 await expect(page.locator("#ttsMode")).toHaveValue("disabled");
 await expect(page.locator("#ttsCostInfo")).toContainText("Sin voz");
});
