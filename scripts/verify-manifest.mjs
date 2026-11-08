import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve,join} from "node:path";
const root=resolve("dist");
const data=JSON.parse(await readFile(join(root,"manifest.json"),"utf8"));
if(data.algorithm!=="SHA-256"||!Array.isArray(data.assets)||data.assets.length<2)throw Error("Manifest no válido.");
for(const item of data.assets){
 if(typeof item.path!=="string"||item.path.includes("..")||item.path.startsWith("/")||!/^[a-zA-Z0-9_./-]+$/.test(item.path))throw Error("Nombre de asset inseguro.");
 const bytes=await readFile(join(root,item.path));
 const hash=createHash("sha256").update(bytes).digest("hex");
 if(hash!==item.sha256||bytes.length!==item.bytes)throw Error("Hash de archivo web incorrecto: "+item.path);
}
console.log("Verified "+data.assets.length+" SHA-256 web assets");
