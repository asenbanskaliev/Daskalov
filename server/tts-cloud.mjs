import {OllamaError} from "./ollama.mjs";
import {validateWaveHeader} from "./audio-wav.mjs";
/** Optional paid TTS (disabled by default); no text or response audio is persisted. */
export async function synthesizeCloudTts({text,env=process.env,fetchImpl=fetch}={}){
 if(env.DASKALOV_ENABLE_TTS_CLOUD!=="1"||!env.DASKALOV_TTS_CLOUD_KEY)throw new OllamaError("TTS Cloud no autorizado.",503);
 if(typeof text!=="string"||!text.trim()||text.length>160)throw new OllamaError("Texto Cloud TTS inválido.",400);
 let response;
 try{
  response=await fetchImpl("https://api.openai.com/v1/audio/speech",{
   method:"POST",
   headers:{authorization:"Bearer "+env.DASKALOV_TTS_CLOUD_KEY,"content-type":"application/json"},
   body:JSON.stringify({model:"gpt-4o-mini-tts",voice:"onyx",input:text,response_format:"wav"}),
   signal:AbortSignal.timeout(25000)
  });
 }catch{throw new OllamaError("El proveedor de TTS Cloud no respondió.",502);}
 if(!response.ok)throw new OllamaError("TTS Cloud rechazó la solicitud.",502);
 const sizeHeader=Number(response.headers.get("content-length"));
 if(Number.isFinite(sizeHeader)&&sizeHeader>3145728)throw new OllamaError("TTS Cloud devolvió audio excesivo.",502);
 let data;
 try{data=Buffer.from(await response.arrayBuffer());}catch{throw new OllamaError("Audio Cloud incompleto.",502);}
 if(data.length<45||data.length>3145728)throw new OllamaError("Audio Cloud fuera de límites.",502);
 try{validateWaveHeader(data);}catch{throw new OllamaError("El proveedor no devolvió WAV válido.",502);}
 return data;
}
