import {chatRemote,streamRemote} from "../server/remote-llm.mjs";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";

/** Two short synthetic requests, never logs secrets, prompts, model text or response headers. */
export async function validateNvidiaLive({key,chat=chatRemote,stream=streamRemote,model="deepseek-ai/deepseek-v4-flash",onPhase=()=>{}}={}){
 if(typeof key!=="string"||key.length<10)throw Error("NVIDIA_SECRET_UNAVAILABLE");
 const messages=[{role:"user",content:"Responde con una frase breve en español sobre una pizarra."}];
 const started=Date.now();
 onPhase("chat");
 const answer=await chat({provider:"nvidia",model,messages,apiKey:key});
 if(typeof answer!=="string"||!answer.trim()||answer.length>6000)throw Error("NVIDIA_CHAT_INVALID");
 onPhase("stream");
 let streamed="",pieces=0;
 for await(const delta of stream({provider:"nvidia",model,messages,apiKey:key})){
  pieces++;streamed+=delta;
  if(streamed.length>6000)throw Error("NVIDIA_STREAM_TOO_LONG");
 }
 if(!streamed.trim()||pieces<1)throw Error("NVIDIA_STREAM_INVALID");
 return {schema:"daskalov-nvidia-live-evidence-v1",model,provider:"nvidia",
  realProviderRequests:2,nonStreamValid:true,streamValid:true,
  streamPieces:pieces,outputChars:[answer.length,streamed.length],
  durationMs:Date.now()-started,rawRepliesExcluded:true,
  sessionDataUsed:false,claimsFullSafetyCertification:false};
}
export function candidateNvidiaModels(ids,max=4){
 if(!Array.isArray(ids))return [];
 const safe=[...new Set(ids.filter(id=>typeof id==="string"&&id.length<130&&/^[A-Za-z0-9_.:-]+\/[A-Za-z0-9_.:+-]+$/.test(id)))];
 const preference=[
  "meta/llama-3.3-70b-instruct",
  "meta/llama-3.1-70b-instruct",
  "meta/llama-4-scout-17b-16e-instruct",
  "qwen/qwen3-next-80b-a3b-instruct",
  "openai/gpt-oss-120b",
  "deepseek-ai/deepseek-v4-flash",
  "nvidia/nemotron-3-super-120b-a12b"
 ];
 const chosen=preference.filter(id=>safe.includes(id));
 const alternatives=safe.filter(id=>/instruct|chat|nemotron|gpt-oss/i.test(id)&&!chosen.includes(id));
 return [...chosen,...alternatives].slice(0,Math.max(1,Math.min(4,max)));
}
export function pickNvidiaModel(ids){return candidateNvidiaModels(ids,1)[0]||null;}
export async function probeNvidiaCandidates({key,models,run=validateNvidiaLive,onPhase=()=>{}}={}){
 const candidates=candidateNvidiaModels(models);
 if(!candidates.length)throw Error("NVIDIA_CATALOG_NO_USABLE_MODEL");
 const unsuccessful=[];
 for(const model of candidates){
  let stage="chat";
  try{
   const evidence=await run({key,model,onPhase:value=>{stage=value;onPhase(value);}});
   return {...evidence,candidateAttempts:unsuccessful.length+1,unavailableModels:unsuccessful.length};
  }catch(error){
   // Retry only 404/410 unavailable models before any successful chat; do
   // not retry authentication/quota/network failures or a failed paid stream.
   const status=String(error?.message||"").match(/HTTP ([0-9]{3})/)?.[1]||"unknown";
   if(stage!=="chat"||!["404","410"].includes(status))throw error;
   unsuccessful.push(status);
  }
 }
 throw Error("NVIDIA_CANDIDATES_UNAVAILABLE_"+unsuccessful.join("_"));
}
async function catalogStatus(key){
 try{
  const response=await fetch("https://integrate.api.nvidia.com/v1/models",{
   headers:{authorization:"Bearer "+key},signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)return {status:response.status,modelIds:[]};
  const catalog=await response.json();
  const modelIds=Array.isArray(catalog?.data)?catalog.data.map(x=>x.id)
   .filter(id=>typeof id==="string"&&id.length<130&&/^[A-Za-z0-9_.:-]+\/[A-Za-z0-9_.:+-]+$/.test(id)):[];
  return {status:response.status,modelIds};
 }catch{return {status:null,modelIds:[]};}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let phase="catalog";
 const key=process.env.NVIDIA_API_KEY;
 if(typeof key!=="string"||key.length<10){
  process.stderr.write("NVIDIA_SECRET_UNAVAILABLE: secret missing or too short.\n");
  process.exitCode=1;
 }else catalogStatus(key).then(({status,modelIds})=>{
  const candidates=candidateNvidiaModels(modelIds);
  process.stdout.write("NVIDIA_CATALOG_HTTP="+(status===null?"unreachable":status)+" models="+modelIds.length+" candidates="+candidates.join(",")+"\n");
  return probeNvidiaCandidates({key,models:modelIds,onPhase:name=>phase=name});
 }).then(result=>{
  process.stdout.write("NVIDIA_LIVE_OK "+JSON.stringify(result)+"\n");
 }).catch(error=>{
  // The HTTP code is authored by the controlled adapter and contains no key.
  // Never print any error.message, URL, headers or upstream response body.
  const match=String(error?.message||"").match(/HTTP ([0-9]{3})/);
  const code=match?match[1]:"unknown";
  process.stderr.write("NVIDIA_LIVE_FAILED phase="+phase+" http="+code+"; raw provider data omitted.\n");
  process.exitCode=1;
 });
}
