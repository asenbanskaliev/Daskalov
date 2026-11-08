import {OllamaError} from "./ollama.mjs";
/**
 * Optional, exclusively local Ollama embeddings. Never silently uses Cloud.
 * No prompt or private memory is sent to a non-loopback host.
 */
export function localEmbeddingEndpoint(env=process.env){
 const raw=env.OLLAMA_LOCAL_URL||"http://127.0.0.1:11434";
 let parsed;
 try{parsed=new URL(raw);}catch{throw new OllamaError("URL Ollama local inválida.",503);}
 if(parsed.protocol!=="http:"||!["localhost","127.0.0.1","[::1]"].includes(parsed.hostname)||parsed.username||parsed.password||parsed.pathname!=="/"||parsed.search||parsed.hash){
  throw new OllamaError("Los embeddings privados requieren Ollama en loopback.",503);
 }
 return parsed.origin+"/api/embed";
}
export async function embedLocal({input,model,env=process.env,fetchImpl=fetch,signal}={}){
 if(env.DASKALOV_ENABLE_LOCAL_EMBEDDINGS!=="1")throw new OllamaError("Embeddings locales desactivados.",503);
 if(typeof input!=="string"||!input.trim()||input.length>1500)throw new OllamaError("Texto de embedding inválido.",400);
 const selected=model||env.DASKALOV_EMBED_MODEL;
 if(typeof selected!=="string"||!/^[a-zA-Z0-9._:/-]{1,100}$/.test(selected))throw new OllamaError("Modelo de embedding no configurado.",503);
 const timeout=AbortSignal.timeout(20000);
 const combined=signal?AbortSignal.any([signal,timeout]):timeout;
 let r;
 try{
  r=await fetchImpl(localEmbeddingEndpoint(env),{
   method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({model:selected,input,truncate:true}),signal:combined
  });
 }catch{
  throw new OllamaError("Ollama local no ha podido generar embeddings.",502);
 }
 if(!r.ok)throw new OllamaError("Ollama local /api/embed devolvió HTTP "+r.status+".",502);
 let data;try{data=await r.json();}catch{throw new OllamaError("Respuesta embedding no válida.",502);}
 const v=data?.embeddings?.[0];
 if(!Array.isArray(v)||v.length<2||v.length>2048||!v.every(n=>typeof n==="number"&&Number.isFinite(n))){
  throw new OllamaError("Vector de embedding inválido.",502);
 }
 return v;
}
