import {chatRemote,streamRemote} from "../server/remote-llm.mjs";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";

/** Two short synthetic requests, never logs secrets, prompts, model text or response headers. */
export async function validateNvidiaLive({key,chat=chatRemote,stream=streamRemote,model="meta/llama-3.1-8b-instruct"}={}){
 if(typeof key!=="string"||key.length<10)throw Error("NVIDIA_SECRET_UNAVAILABLE");
 const messages=[{role:"user",content:"Responde con una frase breve en español sobre una pizarra."}];
 const started=Date.now();
 const answer=await chat({provider:"nvidia",model,messages,apiKey:key});
 if(typeof answer!=="string"||!answer.trim()||answer.length>6000)throw Error("NVIDIA_CHAT_INVALID");
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
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 validateNvidiaLive({key:process.env.NVIDIA_API_KEY}).then(result=>{
  process.stdout.write("NVIDIA_LIVE_OK "+JSON.stringify(result)+"\n");
 }).catch(()=>{
  process.stderr.write("NVIDIA_LIVE_FAILED: secret, transport, model access or response failed; no provider data logged.\n");
  process.exitCode=1;
 });
}
