import {OllamaError} from "./ollama.mjs";

/** Explicit fixed HTTPS allowlist. Never accept a user-controlled upstream URL. */
export const PROVIDER_ENDPOINTS=Object.freeze({
 openrouter:"https://openrouter.ai/api/v1",
 nvidia:"https://integrate.api.nvidia.com/v1"
});
export const NVIDIA_MODEL_FALLBACK=Object.freeze([
 "deepseek-ai/deepseek-v4-flash",
 "meta/llama-3.1-8b-instruct",
 "meta/llama-3.3-70b-instruct",
 "nvidia/nemotron-3.5-lightning-30b-a3b",
 "openai/gpt-oss-120b",
 "qwen/qwen3-next-80b-a3b-instruct"
]);
export function isRemoteProvider(value){return Object.hasOwn(PROVIDER_ENDPOINTS,value);}
export function validateRemoteKey(key){
 if(typeof key!=="string"||key.length<10||key.length>512||!/^[\x21-\x7e]+$/.test(key))
  throw new OllamaError("Falta una clave API válida del proveedor.",401);
 return key;
}
export function validateRemoteModel(model){
 if(typeof model!=="string"||model.length>160||!/^[-\w.:-]+(?:\/[-\w.:+]+)+$/.test(model))
  throw new OllamaError("Modelo externo inválido.",400);
 return model;
}
function connection(provider,apiKey){
 if(!isRemoteProvider(provider))throw new OllamaError("Proveedor externo no admitido.",400);
 return {base:PROVIDER_ENDPOINTS[provider],headers:{authorization:"Bearer "+validateRemoteKey(apiKey)}};
}
export async function listRemoteModels({provider,apiKey,fetchImpl=fetch}={}){
 const {base,headers}=connection(provider,apiKey);
 let result;
 try{result=await fetchImpl(base+"/models",{method:"GET",headers,signal:AbortSignal.timeout(12000)});}
 catch{throw new OllamaError("No es posible consultar los modelos de este proveedor.",502);}
 if(provider==="nvidia"&&[404,405,501].includes(result.status))return [...NVIDIA_MODEL_FALLBACK];
 if(!result.ok)throw new OllamaError("Catálogo no autorizado o inaccesible (HTTP "+result.status+").",result.status===401||result.status===403?401:502);
 let data;try{data=await result.json();}catch{throw new OllamaError("El catálogo externo no contiene JSON válido.",502);}
 if(!Array.isArray(data?.data))throw new OllamaError("Catálogo externo no disponible.",502);
 return [...new Set(data.data.filter(x=>{
  const input=x?.architecture?.input_modalities,output=x?.architecture?.output_modalities;
  return (!Array.isArray(input)||input.includes("text"))&&(!Array.isArray(output)||output.includes("text"));
 }).map(x=>x.id).filter(x=>{try{validateRemoteModel(x);return true;}catch{return false;}}))].sort((a,b)=>Number(b.endsWith(":free"))-Number(a.endsWith(":free"))||a.localeCompare(b)).slice(0,600);
}
function prepare({provider,model,messages,apiKey,stream}){
 const {base,headers}=connection(provider,apiKey);
 validateRemoteModel(model);
 if(!Array.isArray(messages)||!messages.length)throw new OllamaError("Conversación inválida.",400);
 return {url:base+"/chat/completions",options:{method:"POST",headers:{"content-type":"application/json",...headers},
  body:JSON.stringify({model,messages,stream,max_tokens:512,temperature:.65})}};
}
export async function chatRemote({provider,model,messages,apiKey,fetchImpl=fetch,signal}={}){
 const {url,options}=prepare({provider,model,messages,apiKey,stream:false});
 let response;
 try{response=await fetchImpl(url,{...options,signal:signal||AbortSignal.timeout(90000)});}
 catch{throw new OllamaError("No se ha podido conectar con el proveedor externo.",502);}
 if(!response.ok)throw new OllamaError("Error del proveedor externo (HTTP "+response.status+").",502);
 let data;try{data=await response.json();}catch{throw new OllamaError("Respuesta JSON externa inválida.",502);}
 const answer=data?.choices?.[0]?.message?.content;
 if(typeof answer!=="string"||!answer.trim())throw new OllamaError("El proveedor externo no devolvió texto visible.",502);
 if(answer.length>6000)throw new OllamaError("Respuesta demasiado larga.",502);
 return answer;
}
/** Parse OpenAI-compatible SSE, exposing visible text only and never reasoning or vendor errors. */
export async function* streamRemote({provider,model,messages,apiKey,fetchImpl=fetch,signal}={}){
 const {url,options}=prepare({provider,model,messages,apiKey,stream:true});
 const deadline=AbortSignal.timeout(90000);
 const combined=signal?AbortSignal.any([signal,deadline]):deadline;
 let response;
 try{response=await fetchImpl(url,{...options,headers:{...options.headers,accept:"text/event-stream"},signal:combined});}
 catch{throw new OllamaError("No se ha podido iniciar el flujo externo.",502);}
 if(!response.ok)throw new OllamaError("El proveedor rechazó la conversación (HTTP "+response.status+").",502);
 if(!response.body)throw new OllamaError("El proveedor no devolvió flujo.",502);
 const reader=response.body.getReader(),decoder=new TextDecoder();
 let pending="",chars=0,complete=false;
 try{
  while(!complete){
   const {value,done}=await reader.read();
   if(done)break;
   if(combined.aborted)throw new OllamaError("Se agotó el tiempo de respuesta.",502);
   pending+=decoder.decode(value,{stream:true});
   pending=pending.replace(/\r\n/g,"\n");
   if(pending.length>65536)throw new OllamaError("Evento externo demasiado grande.",502);
   let index;
   while((index=pending.indexOf("\n\n"))!==-1){
    const block=pending.slice(0,index);pending=pending.slice(index+2);
    for(const line of block.split("\n").filter(x=>x.startsWith("data:"))){
     const payload=line.slice(5).trim();
     if(payload==="[DONE]"){complete=true;break;}
     if(!payload)continue;
     let event;try{event=JSON.parse(payload);}catch{throw new OllamaError("Formato SSE inválido.",502);}
     if(event.error)throw new OllamaError("Error del proveedor durante el flujo.",502);
     const delta=event.choices?.[0]?.delta?.content;
     if(typeof delta==="string"&&delta.length){
      chars+=delta.length;
      if(chars>6000)throw new OllamaError("Respuesta demasiado larga.",502);
      yield delta;
     }
    }
    if(complete)break;
   }
  }
 }catch(error){
  if(signal?.aborted)throw error;
  if(error instanceof OllamaError)throw error;
  throw new OllamaError("El flujo externo no pudo procesarse.",502);
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 if(!chars)throw new OllamaError("El proveedor no generó texto visible.",502);
}
