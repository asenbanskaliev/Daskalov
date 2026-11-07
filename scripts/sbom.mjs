import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
const lock=JSON.parse(await readFile("package-lock.json","utf8"));
const entries=Object.entries(lock.packages).filter(([path])=>path.startsWith("node_modules/")).map(([path,info])=>({
 name:path.split("node_modules/").at(-1),
 version:info.version||"unknown",
 license:info.license||"NOT_RECORDED",
 integrity:info.integrity||null
})).sort((a,b)=>a.name.localeCompare(b.name));
await mkdir(resolve("reports"),{recursive:true});
await writeFile(resolve("reports","sbom-dependencies.json"),JSON.stringify({schema:"daskalov-dependency-inventory-v1",generatedFrom:"package-lock.json",packages:entries},null,2)+"\n");
console.log("Dependency inventory: "+entries.length+" packages");
