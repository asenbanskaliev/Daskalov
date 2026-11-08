import {mkdir,copyFile,readFile} from "node:fs/promises";
import {join,resolve} from "node:path";
const dest=resolve("dist"),src=resolve("public");
await mkdir(dest,{recursive:true});
for(const name of ["index.html","style.css","app.js","events.js"])await copyFile(join(src,name),join(dest,name));
const html=await readFile(join(dest,"index.html"),"utf8");
if(!html.includes("/app.js")||!html.includes("sceneCanvas"))throw new Error("HTML incompleto");
console.log("Build web preparado en dist/");
