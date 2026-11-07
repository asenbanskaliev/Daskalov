import {test,expect} from "@playwright/test";
test("GFX-007 GAME-004: levantar mano, mirar al frente y actualizar pizarra en modo demo",async({page})=>{
 await page.goto("/");
 await page.locator("#provider").selectOption("demo");
 await page.locator("#raiseHand").click();
 await expect(page.locator("#history")).toContainText("¡Mano levantada");
 await page.getByRole("button",{name:"Matemáticas"}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("tizas");
 await page.locator("#lookForward").click();
 await expect(page.locator("#lookForward")).toBeVisible();
});

test("GAME-006: eventos de clase tienen control de repetición y sin conexión IA",async({page})=>{
 await page.goto("/");
 await page.locator("#provider").selectOption("demo");
 await page.locator('[data-classroom-event="cold"]').click();
 await expect(page.locator("#classroomFeedback")).toContainText("calefacción");
 await page.locator('[data-classroom-event="cold"]').click();
 await expect(page.locator("#classroomFeedback")).toContainText("Espera un momento");
 await page.locator('[data-classroom-event="board"]').click();
 await expect(page.locator("#classroomFeedback")).toContainText("pizarra");
});
