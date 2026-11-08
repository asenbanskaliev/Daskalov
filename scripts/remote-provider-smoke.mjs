import {listRemoteModels,chatRemote,isRemoteProvider,validateRemoteModel,validateRemoteKey} from "../server/remote-llm.mjs";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
/** One authorized synthetic API call, no student text, user data or raw output. */
export async function smokeRemoteProvider({provider,model,apiKey,env=process.env,fetchImpl=fetch,now=()=>Date.now()}={}){
 if(env.DASKALOV_REMOTE_SMOKE_CONSENT!=="1")throw Error("La prueba de API requiere consentimiento explícito.");
 if(!isRemoteProvider(provider))throw Error("Proveedor inválido para prueba autorizada.");
 validateRemoteModel(model);
 validateRemoteKey(apiKey);
 const list=await listRemoteModels({provider,apiKey,fetchImpl});
 if(!list.includes(model))throw Error("Modelo no confirmado por el catálogo actual.");
 const started=now();
 const reply=await chatRemote({provider,model,apiKey,
  messages:[{role:"user",content:"Responde solamente con un saludo corto en español."}],
  fetchImpl});
 if(typeof reply!=="string"||!reply.trim())throw Error("Respuesta sin contenido.");
 return {provider,model,modelListed:true,requestCount:1,
  latencyMs:Math.max(0,Math.round(now()-started)),success:true,
  responseCharacters:reply.length,rawResponseIncluded:false,credentialsStored:false,
  paidOrRateLimitedProvider:true,releaseApproved:false};
}
async function cli(){
 const report=await smokeRemoteProvider({
  provider:process.env.DASKALOV_REMOTE_SMOKE_PROVIDER,
  model:process.env.DASKALOV_REMOTE_SMOKE_MODEL,
  apiKey:process.env.DASKALOV_REMOTE_SMOKE_KEY
 });
 process.stdout.write(JSON.stringify(report)+"\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)cli().catch(error=>{
 process.stderr.write("Error de verificación externa (datos del proveedor omitidos).\n");
 process.exitCode=1;
});
