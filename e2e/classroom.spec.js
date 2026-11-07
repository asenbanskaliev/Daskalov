import {test,expect} from "@playwright/test";
test.beforeEach(async({page})=>{
 await page.route("**/api/models?*",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({models:["beam","qwen2.5:7b"]})}));
});
const id="00000000-0000-4000-8000-000000000011";
function mockTurn(reply,animation="talk"){
 return [
  {type:"started",requestId:id,sequence:0,provider:"cloud",model:"beam"},
  {type:"delta",requestId:id,sequence:1,text:reply},
  {type:"sentence",requestId:id,sequence:2,text:reply},
  {type:"completed",requestId:id,sequence:3,reply,animation,provider:"cloud",model:"beam"}
 ].map(x=>JSON.stringify(x)).join("\n")+"\n";
}

test("WEB-004: se abre aula y el usuario puede utilizar texto incluso sin micrófono",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Profesor Daskalov"})).toBeVisible();
 await expect(page.locator("#question")).toBeVisible();
 await expect(page.locator("#provider")).toHaveValue("cloud");
 await expect(page.locator("#remember")).toBeDisabled();
 await expect(page.locator("#sceneCanvas")).toBeVisible();
});

test("WEB-004: conversación simulada muestra respuesta de Daskalov sin Ollama ni coste Cloud",async({page})=>{
 await page.route("**/api/chat/stream",async route=>{
  const req=route.request().postDataJSON();
  expect(req.text).toContain("matemáticas");
  expect(req).not.toHaveProperty("playerId");
  await route.fulfill({status:200,contentType:"application/x-ndjson",body:mockTurn("¡En mis tiempos sumábamos hasta las sillas!","point_board")});
 });
 await page.goto("/");
 await page.locator("#voiceEnabled").uncheck();
 await page.locator("#question").fill("Profesor, ¿para qué sirven las matemáticas?");
 await page.getByRole("button",{name:"Preguntar al profesor"}).click();
 await expect(page.getByRole("log")).toContainText("¡En mis tiempos sumábamos hasta las sillas!");
 await expect(page.locator("#speechBubble")).toContainText("sumábamos hasta las sillas");
});

test("WEB-006: si no hay WebGL puede conversar igualmente por texto",async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(HTMLCanvasElement.prototype,"getContext",{value:function(type,...rest){
   if(type==="webgl"||type==="webgl2"||type==="experimental-webgl")return null;
   return Object.getPrototypeOf(HTMLCanvasElement.prototype).getContext?.call(this,type,...rest)||null;
  }});
 });
 await page.route("**/api/chat/stream",route=>route.fulfill({status:200,contentType:"application/x-ndjson",body:mockTurn("¡Puedes seguir aprendiendo sin gráficos!","talk")}));
 await page.goto("/");
 await expect(page.locator("#sceneStatus")).toContainText("3D no disponible");
 await page.locator("#voiceEnabled").uncheck();
 await page.locator("#question").fill("Hola profesor");
 await page.locator("#sendButton").click();
 await expect(page.getByRole("log")).toContainText("Puedes seguir aprendiendo sin gráficos");
});

test("WEB-005: controles de IA y teclado son utilizables en tamaño móvil",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");
 await expect(page.locator("#provider")).toBeVisible();
 await expect(page.locator("#model")).toBeVisible();
 await expect(page.locator("#question")).toBeVisible();
 await expect(page.locator("#sendButton")).toBeVisible();
 const width=await page.evaluate(()=>document.documentElement.scrollWidth);
 expect(width).toBeLessThanOrEqual(392);
});

test("WEB-003: una recarga conserva la interfaz y sirve assets compilados",async({page})=>{
 await page.goto("/");
 await page.reload();
 await expect(page.getByRole("heading",{name:"Profesor Daskalov"})).toBeVisible();
 const resources=await page.evaluate(()=>performance.getEntriesByType("resource").filter(e=>e.name.includes("/assets/")).map(e=>e.name));
 expect(resources.length).toBeGreaterThan(0);
});

test("LLM-005: el catálogo de modelos depende del proveedor elegido",async({page})=>{
 await page.goto("/");
 await page.locator("#provider").selectOption("local");
 await expect(page.locator("#model")).toHaveValue("qwen2.5:7b");
 await page.locator("#provider").selectOption("cloud");
 await expect(page.locator("#model")).toHaveValue("beam");
});
