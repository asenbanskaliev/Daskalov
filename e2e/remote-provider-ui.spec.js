import {test,expect} from "@playwright/test";
import {makeTurnEvent} from "../shared/turn-protocol.js";
test("AI-011: OpenRouter from UI loads models, filters catalog, sends ephemeral key and forgets on reload",async({page})=>{
 let sentKey=null,postSeen=false;
 await page.route("**/api/models?provider=openrouter",async route=>{
  sentKey=route.request().headers()["x-daskalov-provider-key"];
  await route.fulfill({contentType:"application/json",body:JSON.stringify({models:["deepseek/deepseek-chat:free","qwen/qwen3-coder:free"]})});
 });
 await page.route("**/api/provider-status?provider=openrouter",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({provider:"openrouter",reachable:true,models:2})}));
 await page.route("**/api/chat/stream",async route=>{
  const req=route.request(),body=req.postDataJSON();
  if(body.provider==="openrouter"){
   postSeen=true;
   expect(req.headers()["x-daskalov-provider-key"]).toBe("sk-or-v1-browser-example");
   expect(body.model).toBe("qwen/qwen3-coder:free");
  }
  const requestId="00000000-0000-4000-8000-000000000001";
  const turns=[
   makeTurnEvent({requestId,sequence:0,type:"started",provider:body.provider,model:body.model}),
   makeTurnEvent({requestId,sequence:1,type:"delta",text:"Buenos días desde OpenRouter."}),
   makeTurnEvent({requestId,sequence:2,type:"completed",reply:"Buenos días desde OpenRouter.",animation:"talk",provider:body.provider,model:body.model})
  ];
  await route.fulfill({contentType:"application/x-ndjson",body:turns.map(x=>JSON.stringify(x)+"\n").join("")});
 });
 await page.goto("/");
 await page.locator("#provider").selectOption("openrouter");
 await expect(page.locator("#providerKeyRow")).toBeVisible();
 await expect(page.locator("#providerStatus")).toContainText("clave API");
 await page.locator("#providerApiKey").fill("sk-or-v1-browser-example");
 await page.locator("#saveProviderKey").click();
 await expect(page.locator("#providerStatus")).toContainText("Conectado");
 expect(sentKey).toBe("sk-or-v1-browser-example");
 await expect(page.locator("#providerApiKey")).toBeEmpty();
 await page.locator("#modelSearch").fill("qwen");
 await expect(page.locator("#modelPicker option")).toHaveCount(2);
 await page.locator("#modelPicker").selectOption("qwen/qwen3-coder:free");
 await expect(page.locator("#model")).toHaveValue("qwen/qwen3-coder:free");
 await page.locator("#question").fill("Hola profesor");
 await page.locator("#sendButton").click();
 await expect(page.locator("#history")).toContainText("Buenos días desde OpenRouter.");
 expect(postSeen).toBe(true);
 const keys=await page.evaluate(()=>Object.entries(localStorage).map(([a,b])=>a+"="+b).join(" "));
 expect(keys).not.toContain("sk-or-v1-browser-example");
 await page.reload();
 await expect(page.locator("#providerKeyStatus")).toContainText("Introduce la API key");
 await expect(page.locator("#providerApiKey")).toBeEmpty();
});
test("AI-011: NVIDIA Build lists catalog and forget button revokes the key immediately",async({page})=>{
 await page.route("**/api/models?provider=nvidia",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({models:["openai/gpt-oss-120b","nvidia/nemotron-3.5-lightning-30b-a3b"]})}));
 await page.route("**/api/provider-status?provider=nvidia",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({reachable:true,models:2})}));
 await page.goto("/");
 await page.locator("#provider").selectOption("nvidia");
 await page.locator("#providerApiKey").fill("nvapi-example-test-key");
 await page.locator("#saveProviderKey").click();
 await expect(page.locator("#modelPicker option")).toHaveCount(3);
 await page.locator("#forgetProviderKey").click();
 await expect(page.locator("#providerKeyStatus")).toContainText("Introduce la API key");
 await expect(page.locator("#model")).toBeEmpty();
});
