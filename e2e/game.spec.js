import {withSettings} from "./support/aula.js";
import {test,expect} from "@playwright/test";
test("GAME-001/004: tres misiones, respuestas y progreso sin llamar a Ollama",async({page})=>{
 let chatCalls=0;
 await page.route("**/api/chat*",route=>{chatCalls++;return route.abort();});
 await page.goto("/");
 await page.getByRole("button",{name:"Matemáticas"}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("tizas");
 await page.locator("#lessonAnswers").getByRole("button",{name:"4"}).click();
 await expect(page.locator("#lessonFeedback")).toContainText("Buen intento");
 await expect(page.locator("#lessonHint")).toContainText("cuatro");
 await page.locator("#lessonAnswers").getByRole("button",{name:"5"}).click();
 await expect(page.locator("#gameProgress")).toContainText("1 de 3");
 await page.getByRole("button",{name:"Lengua",exact:true}).click();
 await page.locator("#lessonAnswers").getByRole("button",{name:"pizarra"}).click();
 await page.getByRole("button",{name:"Historia"}).click();
 await page.locator("#lessonAnswers").getByRole("button",{name:"Una carta escrita en esa época"}).click();
 await expect(page.locator("#gameProgress")).toContainText("3 de 3");
 await expect(page.locator("#gameProgress")).toContainText("30 puntos");
 expect(chatCalls).toBe(0);
});
test("STT-001/002: modo solo teclado funciona sin micrófono",async({page})=>{
 await page.goto("/");
 await withSettings(page,()=>page.locator("#sttMode").selectOption("disabled"));
 await expect(page.locator("#micButton")).toBeDisabled();
 await expect(page.locator("#question")).toBeVisible();
 await withSettings(page,()=>page.locator("#provider").selectOption("demo"));
 await page.locator("#question").fill("¿Qué es la historia?");
 await page.locator("#sendButton").click();
 await expect(page.locator("#history")).toContainText("La historia");
});

test("GAME-007: cambios de dificultad sin crear perfil de edad",async({page})=>{
 await page.goto("/");
 await page.locator("#lessonDifficulty").selectOption("advanced");
 await page.getByRole("button",{name:"Matemáticas"}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("6 tizas");
 await page.locator("#lessonAnswers").getByRole("button",{name:"4"}).click();
 await expect(page.locator("#gameProgress")).toContainText("1 de 3");
 await page.locator("#lessonDifficulty").selectOption("basic");
 await page.getByRole("button",{name:"Lengua",exact:true}).click();
 await expect(page.locator("#lessonQuestion")).toContainText("objeto");
 await page.locator("#lessonAnswers").getByRole("button",{name:"mesa"}).click();
 await expect(page.locator("#gameProgress")).toContainText("2 de 3");
});
