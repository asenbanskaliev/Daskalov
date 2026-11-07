import {OllamaError} from "./ollama.mjs";
const MAX_AUDIO_BYTES=2*1024*1024;
const ACCEPTED_TYPES=new Set(["audio/webm","audio/ogg","audio/wav","audio/x-wav"]);
export function localWhisperAddress(env=process.env){
 const raw=env.DASKALOV_WHISPER_URL;
 if(!raw)throw new OllamaError("Whisper local no está configurado.",503);
 let url;
 try{url=new URL(raw);}catch{throw new OllamaError("URL Whisper inválida.",503);}
 if(url.protocol!=="http:"||url.hostname!=="127.0.0.1"||url.username||url.password||url.search||url.hash||url.pathname!=="/")throw new OllamaError("Whisper debe estar en 127.0.0.1 sin rutas ni credenciales.",503);
 return url.origin;
}
export async function transcribeLocalWhisper({audio,mime="audio/webm",env=process.env,fetchImpl=fetch}){
 const type=mime.split(";")[0].trim().toLowerCase();
 if(!ACCEPTED_TYPES.has(type))throw new OllamaError("Formato de voz no admitido.",415);
 if(!(audio instanceof Uint8Array||Buffer.isBuffer(audio))||audio.length<10||audio.length>MAX_AUDIO_BYTES)throw new OllamaError("Audio inválido o excesivo.",413);
 const base=localWhisperAddress(env);
 const form=new FormData();
 const ext=type==="audio/wav"||type==="audio/x-wav"?"wav":type==="audio/ogg"?"ogg":"webm";
 form.append("file",new Blob([audio],{type}),"alumno."+ext);
 form.append("response_format","json");
 form.append("language","es");
 let reply;
 try{
  reply=await fetchImpl(base+"/inference",{method:"POST",body:form,signal:AbortSignal.timeout(60000)});
 }catch{throw new OllamaError("Whisper local no respondió.",502);}
 if(!reply.ok)throw new OllamaError("Whisper local devolvió HTTP "+reply.status+".",502);
 let data;try{data=await reply.json();}catch{throw new OllamaError("Whisper local devolvió una respuesta inválida.",502);}
 if(typeof data.text!=="string"||!data.text.trim())throw new OllamaError("Whisper no reconoció ninguna frase.",422);
 return data.text.trim().replace(/[\u0000-\u001f]/g," ").slice(0,700);
}
export async function readAudioRequest(req,{maxBytes=MAX_AUDIO_BYTES}={}){
 const type=String(req.headers["content-type"]||"").split(";")[0].trim().toLowerCase();
 if(!ACCEPTED_TYPES.has(type))throw new OllamaError("Tipo de audio no admitido.",415);
 if(Number(req.headers["content-length"])>maxBytes)throw new OllamaError("Audio demasiado grande.",413);
 const pieces=[];let bytes=0;
 for await(const chunk of req){
  bytes+=chunk.length;
  if(bytes>maxBytes)throw new OllamaError("Audio demasiado grande.",413);
  pieces.push(chunk);
 }
 if(bytes<10)throw new OllamaError("Audio demasiado corto.",400);
 return {audio:Buffer.concat(pieces),mime:type};
}
