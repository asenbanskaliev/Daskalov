import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
/** Static GLB budgets, not a measured hardware FPS or true VRAM benchmark. */
export function inspectGlb(bytes,{maxBytes=250000,maxTriangles=30000,maxTextures=8,maxDrawCalls=80}={}){
 if(bytes.length<24||bytes.toString("ascii",0,4)!=="glTF"||bytes.readUInt32LE(4)!==2)throw Error("GLB inválido");
 if(bytes.readUInt32LE(8)!==bytes.length)throw Error("GLB truncado");
 const len=bytes.readUInt32LE(12);
 if(len>bytes.length-20)throw Error("GLB JSON fuera de límites");
 const asset=JSON.parse(bytes.toString("utf8",20,20+len).trim());
 let triangles=0,drawCalls=0,skinnedMeshes=0,morphTargets=0,geometryBytes=0;
 for(const mesh of asset.meshes||[]){
  for(const prim of mesh.primitives||[]){
   drawCalls++;
   if(prim.mode!==undefined&&prim.mode!==4)throw Error("GLB contiene geometría no triangular");
   const indices=asset.accessors[prim.indices];
   triangles+=indices?indices.count/3:asset.accessors[prim.attributes.POSITION].count/3;
   morphTargets=Math.max(morphTargets,prim.targets?.length||0);
   if(prim.attributes.JOINTS_0!==undefined)skinnedMeshes++;
  }
 }
 for(const view of asset.bufferViews||[])geometryBytes+=view.byteLength||0;
 const textures=(asset.textures||[]).length;
 const result={fileBytes:bytes.length,triangles,drawCallsEstimate:drawCalls,textureCount:textures,morphTargets,skinnedMeshes,geometryBytesApprox:geometryBytes,
  limits:{maxBytes,maxTriangles,maxTextures,maxDrawCalls},
  estimatesOnly:true,
  limitations:["Triangle/draw-call counts apply to the GLB, not the whole classroom scene.","Geometry bytes approximate GPU allocations but do not measure VRAM.","FPS requires real device/browser measurements."]};
 result.pass=bytes.length<=maxBytes&&triangles<=maxTriangles&&textures<=maxTextures&&drawCalls<=maxDrawCalls&&skinnedMeshes>=1&&morphTargets>=10;
 return result;
}
async function cli(){
 const bytes=await readFile(resolve("public/assets/daskalov-lowpoly.glb"));
 const report=inspectGlb(bytes);
 await mkdir(resolve("reports"),{recursive:true});
 await writeFile(resolve("reports/graphics-budget.json"),JSON.stringify(report,null,2)+"\n");
 process.stdout.write(JSON.stringify({pass:report.pass,triangles:report.triangles,bytes:report.fileBytes,morphs:report.morphTargets})+"\n");
 if(!report.pass)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)cli().catch(err=>{process.stderr.write(err.message+"\n");process.exitCode=1;});
