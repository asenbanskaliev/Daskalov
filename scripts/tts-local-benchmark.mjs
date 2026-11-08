import {spawn} from "node:child_process";
import {performance} from "node:perf_hooks";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {validateWaveHeader} from "../server/audio-wav.mjs";
import {compareTtsEngines} from "./voice-validation.mjs";

export const ORIGINAL_TEST_LINES=Object.freeze([
 "Buenos días, clase. Vamos a resolver un problema de matemáticas.",
 "El profesor Daskalov dibuja un círculo en la pizarra.",
 "Petar pregunta por la historia de Bulgaria y Pamplona."
]);

/** The operator must inspect paths and model licenses before enabling. No shell. */
export function validateVoiceCommands(config){
 if(!Array.isArray(config?.engines)||config.engines.length!==2)throw Error("Se requieren Piper y Kokoro.");
 if(config.engines.map(x=>x?.engine).sort().join(",")!=="kokoro,piper")throw Error("Motores Piper y Kokoro requeridos.");
 for(const entry of config.engines){
  if(typeof entry.executable!=="string"||!entry.executable.trim()||entry.executable.length>512)throw Error("Ejecutable inválido.");
  if(!Array.isArray(entry.args)||entry.args.length>30||entry.args.some(x=>typeof x!=="string"||x.length>512))throw Error("Argumentos inválidos.");
  if(!entry.args.some(x=>x.includes("{output}")))throw Error("Debe indicar archivo WAV de salida.");
  if(!["stdin","argument"].includes(entry.textMode))throw Error("Modo de entrada inválido.");
  if(entry.textMode==="argument"&&!entry.args.some(x=>x.includes("{text}")))throw Error("Falta texto de argumento.");
 }
 return config.engines;
}
export async function spawnVoiceCommand({entry,text,output,timeoutMs=30000}){
 const args=entry.args.map(x=>x.replaceAll("{output}",output).replaceAll("{text}",text));
 const start=performance.now();
 const child=spawn(entry.executable,args,{shell:false,windowsHide:true,stdio:["pipe","ignore","pipe"]});
 let stderrBytes=0;
 child.stderr?.on("data",chunk=>{stderrBytes+=chunk.length;if(stderrBytes>65536)child.kill();});
 if(entry.textMode==="stdin")child.stdin.end(text+"\n");else child.stdin.end();
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(Error("Síntesis excedió tiempo máximo."));},timeoutMs);
  child.once("error",err=>{clearTimeout(timer);reject(Error("Motor local no disponible: "+err.code));});
  child.once("close",(code,signal)=>{clearTimeout(timer);code===0?resolve():reject(Error("El motor no produjo WAV válido: "+(signal||code)));});
 });
 return Math.round(performance.now()-start);
}
export async function benchmarkVoiceEngines({config,run=spawnVoiceCommand,env=process.env}){
 if(env.DASKALOV_VOICE_BENCHMARK_CONSENT!=="1")throw Error("Se requiere consentimiento expreso para ejecutar motores.");
 const engines=validateVoiceCommands(config);
 const tmp=await mkdtemp(join(tmpdir(),"daskalov-tts-bench-"));
 const observations=[];
 try{
  for(const entry of engines)for(let i=0;i<ORIGINAL_TEST_LINES.length;i++){
   const output=join(tmp,entry.engine+"-"+i+".wav");
   const synthesisMs=await run({entry,text:ORIGINAL_TEST_LINES[i],output});
   if(!Number.isFinite(synthesisMs)||synthesisMs<0)throw Error("Medición de tiempo inválida.");
   const bytes=await readFile(output);
   if(bytes.length>6*1024*1024)throw Error("WAV demasiado grande.");
   const wav=validateWaveHeader(bytes);
   observations.push({engine:entry.engine,synthesisMs,audioDurationMs:wav.durationSec*1000,licenseVerified:false});
  }
  const result=compareTtsEngines(observations);
  if(Object.values(result).some(x=>x.samples!==ORIGINAL_TEST_LINES.length))throw Error("Faltan muestras equivalentes.");
  return {schema:"daskalov-voice-local-benchmark-v1",engines:result,
   comparisons:observations.length,inputs:"3 original fixed Spanish sentences, not user recordings",
   licensesIndependentlyVerified:false,hardwareIndependentlyVerified:false,
   cpuAndRamMeasured:false,blindAccentPanelCompleted:false,releaseApproved:false};
 }finally{await rm(tmp,{recursive:true,force:true});}
}
async function cli(){
 const [configFile,reportFile]=process.argv.slice(2);
 if(!configFile||!reportFile)throw Error("Uso: tts-local-benchmark.mjs <config-privado.json> <salida.json>");
 const config=JSON.parse(await readFile(resolve(configFile),"utf8"));
 const report=await benchmarkVoiceEngines({config});
 await writeFile(resolve(reportFile),JSON.stringify(report,null,2)+"\n",{mode:0o600,flag:"wx"});
 process.stdout.write("Comparación ejecutada. Licencias, CPU/RAM y calidad requieren revisión externa.\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)cli().catch(err=>{process.stderr.write(err.message+"\n");process.exitCode=1;});
