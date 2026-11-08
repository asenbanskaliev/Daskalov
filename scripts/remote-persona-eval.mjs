import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {chatRemote,isRemoteProvider,validateRemoteKey,validateRemoteModel} from "../server/remote-llm.mjs";
import {personaCases,PERSONA_DATASET_VERSION} from "./persona-eval-cases.mjs";
import {buildContext} from "../server/context-builder.mjs";
import {assessReply} from "./persona-eval.mjs";

/** Authorized 1-to-300 real, sequential synthetic cases; no student data. */
export async function evaluateRemotePersona({
 provider="nvidia",model,key,limit=20,chat=chatRemote,
 consent=process.env.DASKALOV_REMOTE_EVAL_CONSENT
}={}){
 if(consent!=="1")throw Error("Evaluación remota no autorizada.");
 if(!isRemoteProvider(provider))throw Error("Proveedor de evaluación no permitido.");
 validateRemoteModel(model);validateRemoteKey(key);
 if(!Number.isInteger(limit)||limit<1||limit>300)throw Error("Límite máximo de evaluaciones inválido.");
 const cases=personaCases().slice(0,limit);
 const groups=Object.fromEntries(["humor","academic","injection","memory"].map(k=>[k,{attempted:0,passedAutomated:0,failedAutomated:0}]));
 const sampleIds=[],flagCounts={},start=Date.now();
 let modelCalls=0,stoppedReason=null;
 for(const example of cases){
  const group=groups[example.kind];
  group.attempted++;modelCalls++;
  try{
   const reply=await chat({provider,model,apiKey:key,messages:buildContext({
    text:example.input,event:"dialog",memories:example.memories,history:example.history
   })});
   const assessed=assessReply(reply);
   if(assessed.pass)group.passedAutomated++;
   else{
    group.failedAutomated++;
    sampleIds.push(example.id);
    for(const kind of assessed.critical)flagCounts[kind]=(flagCounts[kind]||0)+1;
   }
  }catch{
   // Stop on first provider failure. Do not send hundreds of attempts on 429,
   // expired credentials or unverified billing; never log vendor error text.
   group.failedAutomated++;sampleIds.push(example.id);
   flagCounts.providerFailed=(flagCounts.providerFailed||0)+1;
   stoppedReason="provider-request-failed";
   break;
  }
 }
 return {schema:"daskalov-live-persona-eval-v1",
  datasetVersion:PERSONA_DATASET_VERSION,provider,model,
  plannedDatasetCases:300,realModelCalls:modelCalls,requestedLimit:limit,
  completed:modelCalls===limit&&!stoppedReason,stoppedReason,
  groups,flagCounts,failedCaseIds:sampleIds,
  durationMs:Date.now()-start,safeToPublishAggregates:true,
  rawRepliesIncluded:false,apiKeyIncluded:false,adultTeacherReviewComplete:false,
  independentlyCertified:false,releaseApproved:false};
}
async function cli(){
 const provider=process.env.DASKALOV_REMOTE_EVAL_PROVIDER||"nvidia";
 const model=process.env.DASKALOV_REMOTE_EVAL_MODEL;
 const key=provider==="nvidia"?process.env.NVIDIA_API_KEY:process.env.OPENROUTER_API_KEY;
 const limit=Number(process.env.DASKALOV_REMOTE_EVAL_LIMIT||20);
 const result=await evaluateRemotePersona({provider,model,key,limit});
 await mkdir(resolve("reports"),{recursive:true});
 await writeFile(resolve("reports/remote-persona-live.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({provider,model,realModelCalls:result.realModelCalls,
  completed:result.completed,failedCaseCount:result.failedCaseIds.length})+"\n");
 if(!result.completed||result.failedCaseIds.length)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 cli().catch(()=>{process.stderr.write("Evaluación no disponible o autorización ausente (sin detalles de proveedor).\n");process.exitCode=1;});
}
