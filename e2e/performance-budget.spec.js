import {test,expect} from "@playwright/test";
test("PERF-002: live browser render counters and FPS exist without fabricated VRAM data",async({page})=>{
 await page.goto("/");
 await expect(page.locator("#sceneStatus")).toContainText(/personaje GLB local cargado|3D no disponible/,{timeout:15000});
 const status=await page.locator("#sceneStatus").textContent();
 if(status.includes("3D no disponible")){
  // Firefox headless on GitHub runners may have no WebGL device: verify fallback,
  // never fabricate graphics metrics or declare a hardware benchmark.
  await expect(page.locator("#question")).toBeVisible();
  await page.locator("#provider").selectOption("demo");
  await page.locator("#question").fill("Hola profesor");
  await page.locator("#sendButton").click();
  await expect(page.locator("#history")).toContainText("Hola profesor");
  return;
 }
 await page.waitForTimeout(2000);
 await page.locator("#devMetrics summary").click();
 await page.locator("#refreshMetrics").click();
 await expect(page.locator("#devMetricsJson")).toContainText("localBrowserGraphics");
 const snapshot=JSON.parse(await page.locator("#devMetricsJson").innerText());
 const gfx=snapshot.localBrowserGraphics;
 expect(gfx.measuredInBrowser).toBe(true);
 expect(gfx.samples).toBeGreaterThanOrEqual(10);
 expect(gfx.fpsP50).toBeGreaterThan(0);
 expect(gfx.staticBoxInstances).toBeGreaterThan(3);
 expect(gfx.staticBatchDrawCalls).toBeGreaterThan(0);
 expect(gfx.staticDrawCallsSavedEstimate).toBeGreaterThan(0);
 expect(gfx.drawCallsLastFrame).toBeGreaterThan(0);
 expect(gfx.textureObjects).toBeGreaterThanOrEqual(0);
 expect(gfx.hardwareMeasurement).toBe(false);
 expect(gfx.limitations).toMatch(/VRAM/);
});
