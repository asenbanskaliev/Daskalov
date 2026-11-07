import {spawn} from "node:child_process";
import {mkdtemp,readFile,rm,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {OllamaError} from "./ollama.mjs";
import {validateWaveHeader} from "./audio-wav.mjs";
/**
 * Piper runs as an explicitly configured local binary, with no shell, no remote audio
 * upload and no permanent file. Voice model license must be checked by the operator.
 */
export async function synthesizePiper({
 text,env=process.env,spawnImpl=spawn,timeoutMs=25000,maxBytes=3*1024*1024
}){
 if(typeof text!=="string"||!text.trim()||text.length>160)throw new OllamaError("Texto de voz inválido (1-160 caracteres).",400);
 const bin=env.DASKALOV_PIPER_BIN,model=env.DASKALOV_PIPER_MODEL;
 if(!bin||!model||!/\.onnx$/i.test(model))throw new OllamaError("Piper local no está configurado.",503);
 const folder=await mkdtemp(join(tmpdir(),"daskalov-voice-"));
 const output=join(folder,"speech.wav");
 try{
  await new Promise((resolve,reject)=>{
   let ended=false;
   const child=spawnImpl(bin,["--model",model,"--output_file",output],{shell:false,windowsHide:true,stdio:["pipe","ignore","ignore"]});
   const timer=setTimeout(()=>{child.kill();fail(new OllamaError("Síntesis local excedió el tiempo permitido.",504));},Math.max(1000,Math.min(60000,timeoutMs)));
   const clear=()=>{clearTimeout(timer);};
   function fail(e){if(ended)return;ended=true;clear();reject(e);}
   child.on("error",()=>fail(new OllamaError("No se ha podido iniciar Piper.",503)));
   child.on("close",code=>{
    if(ended)return;
    ended=true;clear();
    if(code===0)resolve();
    else reject(new OllamaError("Piper no produjo una respuesta válida.",502));
   });
   child.stdin.on?.("error",()=>fail(new OllamaError("Error de entrada en Piper.",502)));
   child.stdin.end(text+"\n");
  });
  const size=(await stat(output)).size;
  if(size>maxBytes||size<45)throw new OllamaError("Audio local fuera de límites.",502);
  const wav=await readFile(output);
  validateWaveHeader(wav);
  return wav;
 }catch(error){
  if(error instanceof OllamaError)throw error;
  throw new OllamaError("Error al sintetizar voz local.",502);
 }finally{
  await rm(folder,{recursive:true,force:true});
 }
}
