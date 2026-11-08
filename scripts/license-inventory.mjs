import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
export function inventoryLicenses({lock,glb,voiceLicenseEvidence=false,ttsProviderReviewed=false}){
 const packages=Object.entries(lock?.packages||{}).filter(([name])=>name.startsWith("node_modules/"))
  .map(([name,item])=>({package:name.slice("node_modules/".length),version:item.version||null,
   declaredLicense:item.license||null,hasIntegrity:typeof item.integrity==="string"}))
  .sort((a,b)=>a.package.localeCompare(b.package));
 const missingDeclarations=packages.filter(x=>!x.declaredLicense||!x.hasIntegrity).map(x=>x.package);
 const sha256=createHash("sha256").update(glb).digest("hex");
 return {
  schema:"daskalov-license-supply-chain-v1",source:"package-lock.json",
  dependencies:{count:packages.length,missingDeclarations,packages},
  originalGlb:{path:"public/assets/daskalov-lowpoly.glb",sha256,
   provenance:"procedurally generated in repository",externalMaterialAssets:0,
   visualReviewApproved:false},
  externalVoices:{voiceLicenseEvidence:Boolean(voiceLicenseEvidence),ttsProviderReviewed:Boolean(ttsProviderReviewed),
   legalAndActorReviewRequired:true},
  releaseApproved:false,
  reasons:["Audio model/voice and performer rights require independent documentation.",
   "Original avatar provenance is asserted from repository records but art review is not signed.",
   "Dependency license metadata is inventory, not a legal opinion."],
  userDataIncluded:false
 };
}
async function main(){
 const lock=JSON.parse(await readFile(resolve("package-lock.json"),"utf8"));
 const glb=await readFile(resolve("public/assets/daskalov-lowpoly.glb"));
 const report=inventoryLicenses({lock,glb});
 await mkdir(resolve("reports"),{recursive:true});
 await writeFile(resolve("reports/license-inventory.json"),JSON.stringify(report,null,2)+"\n");
 process.stdout.write("License inventory prepared: "+report.dependencies.count+" dependencies; releaseApproved=false.\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{process.stderr.write(e.message+"\n");process.exitCode=1;});
