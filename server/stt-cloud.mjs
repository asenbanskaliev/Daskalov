import {OllamaError} from "./ollama.mjs";
/** Optional paid transcription. Fixed HTTPS target, disabled without administrator key. */
export async function transcribeCloudStt({audio,mime="audio/webm",env=process.env,fetchImpl=fetch}={}){
 if(env.DASKALOV_ENABLE_STT_CLOUD!=="1"||!env.DASKALOV_STT_CLOUD_KEY)throw new OllamaError("STT Cloud sin autorización administrativa.",503);
 const type=String(mime).split(";")[0].toLowerCase();
 const types={"audio/webm":"webm","audio/ogg":"ogg","audio/wav":"wav","audio/x-wav":"wav"};
 if(!Object.hasOwn(types,type))throw new OllamaError("Formato STT no permitido.",415);
 if(!(audio instanceof Uint8Array)||audio.length<10||audio.length>2097152)throw new OllamaError("Audio fuera de límites.",413);
 const form=new FormData();
 form.append("file",new Blob([audio],{type}),"audio."+types[type]);
 form.append("model","gpt-4o-mini-transcribe");
 form.append("language","es");
 let result;
 try{
  result=await fetchImpl("https://api.openai.com/v1/audio/transcriptions",{
   method:"POST",headers:{authorization:"Bearer "+env.DASKALOV_STT_CLOUD_KEY},
   body:form,signal:AbortSignal.timeout(30000)
  });
 }catch{throw new OllamaError("Servicio de transcripción Cloud no disponible.",502);}
 if(!result.ok)throw new OllamaError("Proveedor STT Cloud rechazó solicitud.",502);
 let payload;try{payload=await result.json();}catch{throw new OllamaError("Respuesta STT Cloud inválida.",502);}
 if(typeof payload?.text!=="string"||!payload.text.trim())throw new OllamaError("STT Cloud no reconoció voz.",422);
 return payload.text.trim().replace(/[\u0000-\u001f]/g," ").slice(0,700);
}
