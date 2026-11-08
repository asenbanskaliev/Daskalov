import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";
test("PERF-006: métricas privadas se muestran solo si el usuario lo solicita",async({page})=>{
 let calls=0;
 await page.route("**/api/metrics",route=>{
  calls++;
  return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({scope:"anonymous-aggregate",providers:{local:{requests:3,durationP95Ms:210}}})});
 });
 await page.goto("/");
 await page.locator("#settingsToggle").click();
 await expect(page.locator("#devMetrics")).toBeVisible();
 await expect(page.locator("#devMetricsJson")).toBeHidden();
 expect(calls).toBe(0);
 await page.locator("#devMetrics summary").click();
 expect(calls).toBe(0);
 await page.locator("#refreshMetrics").click();
 await expect(page.locator("#devMetricsJson")).toContainText("210");
 expect(calls).toBe(1);
});
