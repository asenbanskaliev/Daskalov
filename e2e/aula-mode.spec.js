import {test,expect} from "@playwright/test";

test("AULA-001: settings stay hidden until requested, trap keyboard and return focus",async({page})=>{
 await page.goto("/");
 await expect(page.locator("#settingsDrawer")).toBeHidden();
 await expect(page.locator("#question")).toBeVisible();
 await expect(page.locator("#lessonPanel")).toBeVisible();
 await page.locator("#question").fill("Profesor, quiero aprender");
 await page.locator("#settingsToggle").click();
 await expect(page.locator("#settingsDrawer")).toBeVisible();
 await expect(page.locator("#settingsClose")).toBeFocused();
 await expect(page.locator("#settingsToggle")).toHaveAttribute("aria-expanded","true");
 await expect(page.locator("#provider")).toBeVisible();
 await expect(page.locator("#providerApiKey")).toHaveAttribute("type","password");
 await page.keyboard.press("Shift+Tab");
 await expect(page.locator("#settingsDrawer")).toContainText("Configuración del aula");
 expect(await page.evaluate(()=>document.activeElement.closest("#settingsDrawer")!==null)).toBe(true);
 await page.keyboard.press("Escape");
 await expect(page.locator("#settingsDrawer")).toBeHidden();
 await expect(page.locator("#settingsToggle")).toBeFocused();
 await expect(page.locator("#question")).toHaveValue("Profesor, quiero aprender");
 await expect(page.locator("#settingsToggle")).toHaveAttribute("aria-expanded","false");
});

test("AULA-002: lessons and history are independently collapsible without losing answers",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:"Matemáticas",exact:true}).click();
 await page.locator("#lessonAnswers").getByRole("button",{name:"5",exact:true}).click();
 await expect(page.locator("#gameProgress")).toContainText("1 de 3");
 await page.locator("#lessonsToggle").click();
 await expect(page.locator("#activityHub")).toBeHidden();
 await expect(page.locator("#lessonsToggle")).toHaveAttribute("aria-expanded","false");
 await page.locator("#historyToggle").click();
 await expect(page.locator("#history")).toBeHidden();
 await expect(page.locator("#question")).toBeVisible();
 await page.locator("#historyToggle").click();
 await page.locator("#lessonsToggle").click();
 await expect(page.locator("#gameProgress")).toContainText("1 de 3");
 await expect(page.locator("#history")).toBeVisible();
});

test("AULA-003: fullscreen denial falls back to immersive CSS; chat, scene and lessons survive",async({page})=>{
 await page.addInitScript(()=>{
  Element.prototype.requestFullscreen=function(){return Promise.reject(new DOMException("Denied by browser","NotAllowedError"));};
  const native=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(String(kind).startsWith("webgl"))return null;
   return native.call(this,kind,...args);
  };
 });
 await page.goto("/");
 await page.locator("#question").fill("La conversación no debe borrarse");
 await page.evaluate(()=>{document.querySelector("#sceneCanvas").dataset.sceneIdentity="original";});
 await page.locator("#fullscreenToggle").click();
 await expect(page.locator("#mainContent")).toHaveClass(/is-immersive/);
 await expect(page.locator("#fullscreenToggle")).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#question")).toHaveValue("La conversación no debe borrarse");
 await expect(page.locator("#speechBubble")).toBeVisible();
 await expect(page.locator("#activityHub")).toBeHidden();
 await page.locator("#lessonsToggle").click();
 await expect(page.locator("#lessonPanel")).toBeVisible();
 await page.getByRole("button",{name:"Historia",exact:true}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("fuente primaria");
 await page.keyboard.press("Escape");
 await expect(page.locator("#activityHub")).toBeHidden();
 await page.locator("#settingsToggle").click();
 await expect(page.locator("#settingsDrawer")).toBeVisible();
 await page.locator("#graphicsQuality").selectOption("low");
 await page.keyboard.press("Escape");
 await expect(page.locator("#settingsDrawer")).toBeHidden();
 await page.locator("#fullscreenToggle").click();
 await expect(page.locator("#mainContent")).not.toHaveClass(/is-immersive/);
 await expect(page.locator("#fullscreenToggle")).toHaveAttribute("aria-pressed","false");
 await expect(page.locator("#question")).toHaveValue("La conversación no debe borrarse");
 expect(await page.locator("#sceneCanvas").getAttribute("data-scene-identity")).toBe("original");
 await expect(page.locator("#activityHub")).toBeVisible();
});

for(const width of [320,390]){
 test("AULA-004: immersive controls fit "+width+"px viewport without horizontal overflow",async({page})=>{
  await page.setViewportSize({width,height:720});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(()=>{
   Element.prototype.requestFullscreen=()=>Promise.reject(new Error("No native fullscreen"));
   const old=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    if(String(kind).startsWith("webgl"))return null;
    return old.call(this,kind,...args);
   };
  });
  await page.goto("/");
  await page.locator("#fullscreenToggle").click();
  await expect(page.locator("#mainContent")).toHaveClass(/is-immersive/);
  for(const selector of ["#settingsToggle","#lessonsToggle","#fullscreenToggle","#question","#sendButton"]){
   const rect=await page.locator(selector).boundingBox();
   expect(rect,selector).not.toBeNull();
   expect(rect.width,selector+" width").toBeGreaterThanOrEqual(24);
   expect(rect.height,selector+" height").toBeGreaterThanOrEqual(24);
   expect(rect.x).toBeGreaterThanOrEqual(0);
   expect(rect.x+rect.width).toBeLessThanOrEqual(width+2);
  }
  await page.locator("#settingsToggle").click();
  await expect(page.locator("#settingsDrawer")).toBeVisible();
  await expect(page.locator("#provider")).toBeVisible();
  await page.locator("#settingsClose").click();
  const overflow=await page.evaluate(()=>({
   doc:document.documentElement.scrollWidth,
   body:document.body.scrollWidth,
   viewport:document.documentElement.clientWidth
  }));
  expect(overflow.doc).toBeLessThanOrEqual(width+2);
  await page.keyboard.press("Escape");
  await expect(page.locator("#mainContent")).not.toHaveClass(/is-immersive/);
 });
}

test("AULA-005: real browser fullscreen API is used when available, otherwise view falls back safely",async({page})=>{
 await page.goto("/");
 const supported=await page.evaluate(()=>typeof document.getElementById("mainContent").requestFullscreen==="function");
 await page.locator("#fullscreenToggle").click();
 await expect(page.locator("#mainContent")).toHaveClass(/is-immersive/);
 await expect(page.locator("#fullscreenToggle")).toHaveAttribute("aria-pressed","true");
 const fullscreenElement=await page.evaluate(()=>document.fullscreenElement?.id||null);
 if(fullscreenElement!==null){
  expect(supported).toBe(true);
  expect(fullscreenElement).toBe("mainContent");
 }
 await expect(page.locator("#question")).toBeVisible();
 await page.locator("#fullscreenToggle").click();
 await expect(page.locator("#mainContent")).not.toHaveClass(/is-immersive/);
 await expect(page.locator("#fullscreenToggle")).toHaveAttribute("aria-pressed","false");
 expect(await page.evaluate(()=>document.fullscreenElement===document.getElementById("mainContent"))).toBe(false);
});
