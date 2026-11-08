import {readFile,readdir,writeFile,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {join,resolve} from "node:path";
const root=resolve("dist");
const pkg=JSON.parse(await readFile("package.json","utf8"));
const entries=[];
async function enumerate(dir,prefix=""){
 for(const name of (await readdir(dir)).sort()){
  const path=join(dir,name),relative=prefix?prefix+"/"+name:name;
  const info=await stat(path);
  if(info.isDirectory())await enumerate(path,relative);
  else if(relative!=="manifest.json"){
   const data=await readFile(path);
   entries.push({path:relative,bytes:data.length,sha256:createHash("sha256").update(data).digest("hex")});
  }
 }
}
await enumerate(root);
await writeFile(join(root,"manifest.json"),JSON.stringify({name:pkg.name,version:pkg.version,algorithm:"SHA-256",assets:entries},null,2)+"\n");
console.log("Build integrity manifest: "+entries.length+" assets");
