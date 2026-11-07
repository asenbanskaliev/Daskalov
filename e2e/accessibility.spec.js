import {test,expect} from "@playwright/test";
test.beforeEach(async({page})=>{
 await page.route("**/api/models?*",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({models:["beam","qwen2.5:7b"]})}));
 await page.route("**/api/provider-status?*",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({provider:"cloud",reachable:true,models:2})}));
});
test("WEB-005: panel accesible ofrece calidad, voz, permiso, estado e indicadores",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");
 await expect(page.locator("#graphicsQuality")).toBeVisible();
 await expect(page.locator("#voiceChoice")).toBeVisible();
 await expect(page.locator("#providerStatus")).toContainText("Conectado");
 await expect(page.locator("#memoryPermission")).toBeVisible();
 await expect(page.locator("#micStatus")).toBeVisible();
 await expect(page.locator("#pauseVoice")).toBeVisible();
 await expect(page.locator("#resumeVoice")).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(392);
});
test("WEB-005: calidad baja se conserva tras recargar la página",async({page})=>{
 await page.goto("/");
 await page.locator("#graphicsQuality").selectOption("low");
 await page.reload();
 await expect(page.locator("#graphicsQuality")).toHaveValue("low");
});
test("WEB-007: navegación con teclado, foco y reducción de animación",async({page})=>{
 await page.goto("/");
 await page.keyboard.press("Tab");
 await expect(page.locator(".skip-link")).toBeFocused();
 await page.keyboard.press("Enter");
 await expect(page.locator("#question")).toBeFocused();
 await page.locator("#reducedMotion").check();
 await expect(page.locator("#reducedMotion")).toBeChecked();
});
