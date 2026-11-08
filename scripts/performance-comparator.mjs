import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

/**
 * Strict before/after performance profile comparison.
 * Input reports must come from controlled hardware sessions. This does not
 * independently prove their origin and never signs a release gate.
 */
export function comparePerformance(before,after){
 const required=(x,kind)=>{
  if(!x||x.schema!=="daskalov-hardware-perf-v1"||typeof x!=="object")throw Error(kind+": formato incorrecto.");
  for(const key of ["browser","deviceTier","quality","resolution","benchmarkId"]){
   if(typeof x[key]!=="string"||x[key].length<1||x[key].length>64)throw Error(kind+": parámetro inválido: "+key);
  }
  if(!/^[a-f0-9]{40}$/i.test(x.sha||""))throw Error(kind+": se exige SHA exacto.");
  if(!Number.isFinite(x.durationMs)||x.durationMs<300000||!Number.isInteger(x.samples)||x.samples<100)throw Error(kind+": medición insuficiente (5 minutos).");
  for(const key of ["fpsP05","fpsP50"]){
   if(!Number.isFinite(x[key])||x[key]<=0||x[key]>240)throw Error(kind+": FPS inválido.");
  }
  if(x.firstAudioP50Ms!==null&&x.firstAudioP50Ms!==undefined&&(!Number.isFinite(x.firstAudioP50Ms)||x.firstAudioP50Ms<0))throw Error(kind+": audio inválido.");
 };
 required(before,"before");required(after,"after");
 if(before.sha===after.sha)throw Error("Los commits deben ser distintos.");
 for(const key of ["browser","deviceTier","quality","resolution","benchmarkId"]){
  if(before[key]!==after[key])throw Error("Perfil o navegador distinto: "+key);
 }
 const deltaFpsP50=Number((after.fpsP50-before.fpsP50).toFixed(2));
 const deltaFpsP05=Number((after.fpsP05-before.fpsP05).toFixed(2));
 const firstAudioDeltaMs=before.firstAudioP50Ms!==undefined&&before.firstAudioP50Ms!==null&&after.firstAudioP50Ms!==undefined&&after.firstAudioP50Ms!==null?
  Number((after.firstAudioP50Ms-before.firstAudioP50Ms).toFixed(2)):null;
 return {schema:"daskalov-performance-comparison-v1",beforeSha:before.sha,afterSha:after.sha,
  context:{browser:before.browser,deviceTier:before.deviceTier,quality:before.quality,resolution:before.resolution,benchmarkId:before.benchmarkId},
  deltaFpsP50,deltaFpsP05,deltaFirstAudioP50Ms:firstAudioDeltaMs,
  fpsP50RegressionGreaterThan5Percent:deltaFpsP50<(-.05*before.fpsP50),
  audioP50RegressionGreaterThan10Percent:firstAudioDeltaMs!==null&&before.firstAudioP50Ms>0&&firstAudioDeltaMs>.1*before.firstAudioP50Ms,
  independentHardwareEvidenceVerified:false,
  releaseApproved:false,
  limitations:["Source reports are caller supplied and require independent hardware verification.","No student messages, audio, device serials or GPU identifiers are stored.","The comparison is not a real Cloud SLA or signed performance review."]};
}
async function main(){
 const [beforeFile,afterFile,outputFile]=process.argv.slice(2);
 if(!beforeFile||!afterFile||!outputFile)throw Error("Uso: perf:compare -- <before.json> <after.json> <output.json>");
 const [before,after]=await Promise.all([beforeFile,afterFile].map(async p=>JSON.parse(await readFile(resolve(p),"utf8"))));
 const result=comparePerformance(before,after);
 await mkdir(resolve(outputFile,".."),{recursive:true});
 await writeFile(resolve(outputFile),JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write("Performance comparison completed. Independent verification remains required.\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{process.stderr.write(error.message+"\n");process.exitCode=1;});
