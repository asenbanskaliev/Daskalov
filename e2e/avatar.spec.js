import {test,expect} from "@playwright/test";
test("GFX-002: the local teacher GLB is available with no external asset fetch",async({page})=>{
 const glb=await page.request.get("/assets/daskalov-lowpoly.glb");
 expect(glb.ok()).toBe(true);
 const bytes=await glb.body();
 expect(bytes.byteLength).toBeGreaterThan(1000);
 expect(bytes.subarray(0,4).toString("ascii")).toBe("glTF");
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Profesor Daskalov"})).toBeVisible();
 const hasWebGL=await page.evaluate(()=>{
  const canvas=document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2")||canvas.getContext("webgl"));
 });
 if(hasWebGL){
  await expect(page.locator("#sceneStatus")).toContainText("GLB local cargado",{timeout:12000});
 }else{
  await expect(page.locator("#sceneStatus")).toContainText("3D no disponible");
 }
});
