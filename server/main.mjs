import http from "node:http";
import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import {normalizeReply,inferAnimation} from "./personality.mjs";
import {buildContext} from "./context-builder.mjs";
import {safeDeterministicReply} from "./child-safety.mjs";
import {chatOllama,streamOllama,listOllamaModels,OllamaError,validateModel,validateProvider} from "./ollama.mjs";
import {SentenceChunker} from "./stream.mjs";
import {streamWithOptionalFallback} from "./fallback.mjs";
import {retryLocalStream} from "./resilience.mjs";
import {MetricsCollector} from "./metrics.mjs";
import {isPrivateHost,UsageBudget} from "./access-policy.mjs";
import {makeTurnEvent} from "../shared/turn-protocol.js";
import {synthesizePiper} from "./tts-piper.mjs";
import {transcribeLocalWhisper,readAudioRequest} from "./stt-whisper.mjs";
import {installSecurityHeaders} from "./security-headers.mjs";
import {openMemory} from "./memory.mjs";
import {createSession, getSession, csrfIsValid, isSameSiteRequest, clearSessionCookie} from "./session.mjs";

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const files={"/":["index.html","text/html"],"/index.html":["index.html","text/html"],"/style.css":["style.css","text/css"],"/app.js":["app.js","text/javascript"],"/events.js":["events.js","text/javascript"]};

function respond(res,status,payload){
 res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});
 res.end(JSON.stringify(payload));
}
async function bodyOf(req){
 if(!req.headers["content-type"]?.startsWith("application/json"))throw new OllamaError("Se requiere JSON.",415);
 let input="";
 for await(const chunk of req){
  input+=chunk;
  if(input.length>12000)throw new OllamaError("Mensaje demasiado grande.",413);
 }
 try{return JSON.parse(input);}catch{throw new OllamaError("JSON inválido.",400);}
}
function requireSession(req,memory){
 const session=getSession(req,memory);
 if(!session)throw new OllamaError("Necesitas una sesión autorizada para acceder a recuerdos.",401);
 if(!csrfIsValid(req,session))throw new OllamaError("La sesión necesita un token de seguridad válido.",403);
 return session;
}
function rejectClientPlayerId(body){
 if(body&&Object.hasOwn(body,"playerId"))throw new OllamaError("El cliente no puede indicar la identidad de otro jugador.",400);
}
export function createApp({
 dbPath=join(root,"server","data","daskalov.sqlite"),
 llm=chatOllama,
 streamLlm=streamOllama,
 models=listOllamaModels,
 ttsSynth=synthesizePiper,
 sttTranscriber=transcribeLocalWhisper,
 allowMemory=process.env.DASKALOV_ALLOW_MEMORY==="1",
 maxCallsPerMinute=12,
 maxCallsPerDay=60,
 maxConcurrent=1,
 maxCloudCallsPerDay=24
}={}){
 const memory=openMemory(dbPath);
 memory.cleanup();
 const rate=new Map();
 const daily=new Map();
 const inFlight=new Map();
 const cloudBudget=new UsageBudget({dailyLimit:maxCloudCallsPerDay});
 const metrics=new MetricsCollector({cloudUsdPerMillionOutputTokens:process.env.DASKALOV_USD_PER_1M_OUTPUT_TOKENS??null});
 const server=http.createServer(async(req,res)=>{
  installSecurityHeaders(res);
  const url=new URL(req.url||"/","http://localhost"),path=url.pathname;
  try{
   if(["POST","PUT","PATCH","DELETE"].includes(req.method)&&!isSameSiteRequest(req)){
    throw new OllamaError("Solicitud de otro sitio bloqueada.",403);
   }
   if(path==="/api/metrics"&&req.method==="GET"){
    if(!isPrivateHost(req.headers.host))throw new OllamaError("Métricas solo disponibles en modo privado.",403);
    return respond(res,200,metrics.snapshot());
   }
   if(path==="/api/health"&&req.method==="GET")return respond(res,200,{ok:true,cloudConfigured:!!process.env.OLLAMA_API_KEY});
   if(path==="/api/stt/status"&&req.method==="GET"){
    return respond(res,200,{available:Boolean(process.env.DASKALOV_WHISPER_URL),provider:"whisper-local",recordingPersisted:false});
   }
   if(path==="/api/stt/local"&&req.method==="POST"){
    if(!isPrivateHost(req.headers.host))throw new OllamaError("Transcripción local permitida solo desde localhost.",403);
    const {audio,mime}=await readAudioRequest(req);
    const transcript=await sttTranscriber({audio,mime});
    return respond(res,200,{transcript});
   }
   if(path==="/api/tts/status"&&req.method==="GET"){
    return respond(res,200,{available:Boolean(process.env.DASKALOV_PIPER_BIN&&process.env.DASKALOV_PIPER_MODEL),provider:"piper-local"});
   }
   if(path==="/api/tts/local"&&req.method==="POST"){
    if(!isPrivateHost(req.headers.host))throw new OllamaError("Voz local disponible solo desde localhost.",403);
    const body=await bodyOf(req);
    if(typeof body.text!=="string"||!body.text.trim()||body.text.length>160)throw new OllamaError("Texto de voz inválido.",400);
    const wav=await ttsSynth({text:body.text});
    if(!Buffer.isBuffer(wav)||wav.length>3*1024*1024)throw new OllamaError("Audio local inválido.",502);
    res.writeHead(200,{"content-type":"audio/wav","cache-control":"no-store","x-content-type-options":"nosniff"});
    return res.end(wav);
   }
   if(path==="/api/session"&&req.method==="GET"){
    const active=getSession(req,memory);
    return respond(res,200,{active:Boolean(active),csrfToken:active?.csrfToken||null,memoryAvailable:allowMemory});
   }
   if(path==="/api/session"&&req.method==="POST"){
    if(!allowMemory)throw new OllamaError("Memoria persistente desactivada en el servidor.",403);
    let active=getSession(req,memory);
    if(!active){
     const secure=req.socket.encrypted===true||process.env.DASKALOV_SECURE_COOKIES==="1";
     const issued=createSession(memory,{secure});
     res.setHeader("set-cookie",issued.cookie);
     active={csrfToken:issued.csrfToken};
    }
    return respond(res,200,{active:true,csrfToken:active.csrfToken,memoryAvailable:allowMemory});
   }
   if(path==="/api/models"&&req.method==="GET"){
    const provider=validateProvider(url.searchParams.get("provider"));
    if(provider==="cloud"&&!isPrivateHost(req.headers.host))throw new OllamaError("Cloud solo está disponible en modo privado.",403);
    return respond(res,200,{models:await models({provider})});
   }
   if(path==="/api/provider-status"&&req.method==="GET"){
    const provider=validateProvider(url.searchParams.get("provider"));
    if(provider==="cloud"&&!isPrivateHost(req.headers.host))throw new OllamaError("Cloud solo está disponible en modo privado.",403);
    try{
     const available=await models({provider});
     return respond(res,200,{provider,reachable:true,models:available.length});
    }catch{return respond(res,200,{provider,reachable:false,models:0});}
   }
   if((path==="/api/memory/export"||path==="/api/memory/correct"||path==="/api/progress")&&req.method==="POST"){
    if(!allowMemory)throw new OllamaError("Memoria desactivada en este servidor.",403);
    const session=requireSession(req,memory);
    const body=await bodyOf(req);
    rejectClientPlayerId(body);
    if(path==="/api/memory/export")return respond(res,200,memory.exportPlayer(session.playerId));
    if(path==="/api/memory/correct"){
     if(!memory.correctMemory(session.playerId,body.id,body.content))throw new OllamaError("Recuerdo inexistente o datos inválidos.",404);
     return respond(res,200,{updated:true});
    }
    if(body.readOnly===true)return respond(res,200,{progress:memory.getProgress(session.playerId)});
    if(!["math","language","history"].includes(body.lessonId)||body.points!==10)throw new OllamaError("Progreso inválido.",400);
    memory.recordProgress(session.playerId,body.lessonId,body.points);
    return respond(res,200,{progress:memory.getProgress(session.playerId)});
   }
   if(path==="/api/memory"&&["POST","DELETE"].includes(req.method)){
    const session=requireSession(req,memory);
    const body=await bodyOf(req);
    rejectClientPlayerId(body);
    if(req.method==="DELETE"){
     memory.deletePlayer(session.playerId);
     memory.revokeSession(session.keyHash);
     res.setHeader("set-cookie",clearSessionCookie(req.socket.encrypted===true||process.env.DASKALOV_SECURE_COOKIES==="1"));
     return respond(res,200,{deleted:true});
    }
    return respond(res,200,{memories:memory.list(session.playerId)});
   }
   if((path==="/api/chat"||path==="/api/chat/stream")&&req.method==="POST"){
    const body=await bodyOf(req);
    rejectClientPlayerId(body);
    const provider=validateProvider(body.provider),model=validateModel(body.model);
    if(provider==="cloud"&&!isPrivateHost(req.headers.host))throw new OllamaError("Cloud no está habilitado fuera de localhost.",403);
    if(typeof body.text!=="string"||!body.text.trim()||body.text.length>700)throw new OllamaError("Mensaje inválido (1-700 caracteres).",400);
    const event=["dialog","turned_around","interruption","long_silence","hand_raised"].includes(body.event)?body.event:"dialog";
    const safetyReply=safeDeterministicReply(body.text);
    if(safetyReply){
     const reply=normalizeReply(safetyReply);
     if(path==="/api/chat"){
      return respond(res,200,{reply,animation:"talk",provider:"safety",model:"deterministic"});
     }
     const requestId=randomUUID();
     res.writeHead(200,{"content-type":"application/x-ndjson; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});
     const events=[
      {type:"started",provider:"safety",model:"deterministic"},
      {type:"delta",text:reply},
      {type:"sentence",text:reply},
      {type:"completed",reply,animation:"talk",provider:"safety",model:"deterministic"}
     ];
     events.forEach((item,sequence)=>res.write(JSON.stringify(makeTurnEvent({requestId,sequence,...item}))+"\n"));
     return res.end();
    }
    const remember=body.remember===true;
    let session=null;
    if(remember){
     if(!allowMemory)throw new OllamaError("La memoria está desactivada en el servidor.",403);
     session=requireSession(req,memory);
    }
    const ip=req.socket.remoteAddress||"unknown",now=Date.now();
    const times=(rate.get(ip)||[]).filter(t=>now-t<60000);
    if(times.length>=maxCallsPerMinute)throw new OllamaError("Demasiadas preguntas: inténtalo en un minuto.",429);
    const day=new Date(now).toISOString().slice(0,10);
    const counter=daily.get(ip);
    if(counter?.day===day&&counter.count>=maxCallsPerDay)throw new OllamaError("Cuota diaria alcanzada.",429);
    if((inFlight.get(ip)||0)>=maxConcurrent)throw new OllamaError("Hay otra pregunta en curso.",429);
    if(provider==="cloud"&&!cloudBudget.reserve(new Date(now)))throw new OllamaError("Presupuesto diario de Cloud alcanzado.",429);
    times.push(now);rate.set(ip,times);
    daily.set(ip,{day,count:(counter?.day===day?counter.count:0)+1});
    inFlight.set(ip,(inFlight.get(ip)||0)+1);
    try{
     const memories=remember?memory.search(session.playerId,body.text):[];
     const messages=buildContext({text:body.text,event,memories,history:body.history});
     if(path==="/api/chat/stream"){
      const requestId=randomUUID(),chunker=new SentenceChunker();
      const cancellation=new AbortController();
      let sequence=0,full="",finalProvider=provider,finalModel=model,firstTokenMs=null,completedStream=false;
      const startedMs=Date.now();
      res.once("close",()=>{if(!res.writableEnded)cancellation.abort();});
      res.writeHead(200,{
       "content-type":"application/x-ndjson; charset=utf-8",
       "cache-control":"no-cache, no-transform",
       "x-content-type-options":"nosniff",
       "x-accel-buffering":"no"
      });
      const emit=(type,data={})=>{
       if(!res.destroyed&&!cancellation.signal.aborted){
        res.write(JSON.stringify(makeTurnEvent({type,requestId,sequence:sequence++,...data}))+"\n");
       }
      };
      try{
       emit("started",{provider,model});
       const effectiveStream=(args)=>body.allowFallbackToCloud===true
        ?streamLlm(args)
        :retryLocalStream({provider:args.provider,signal:args.signal,run:()=>streamLlm(args)});
       for await(const packet of streamWithOptionalFallback({
        provider,model,messages,signal:cancellation.signal,streamLlm:effectiveStream,
        allowFallbackToCloud:body.allowFallbackToCloud===true,
        reserveCloud:()=>isPrivateHost(req.headers.host)&&cloudBudget.reserve()
       })){
        if(cancellation.signal.aborted)break;
        if(packet.provider!==finalProvider){
         finalProvider=packet.provider;finalModel=packet.model;
         emit("provider-switched",{provider:finalProvider,model:finalModel});
        }
        const text=String(packet.text);
        if(firstTokenMs===null&&text.length)firstTokenMs=Date.now()-startedMs;
        full+=text;
        if(full.length>6000)throw new OllamaError("Respuesta demasiado larga.",502);
        emit("delta",{text});
        for(const sentence of chunker.push(text))emit("sentence",{text:sentence});
       }
       if(!cancellation.signal.aborted){
        const reply=normalizeReply(full);
        if(!reply)throw new OllamaError("Ollama no devolvió texto.",502);
        for(const sentence of chunker.flush())emit("sentence",{text:sentence});
        if(remember){
         memory.save(session.playerId,"user",body.text);
         memory.save(session.playerId,"assistant",reply);
        }
        emit("gesture",{animation:inferAnimation(reply,event)});
        emit("completed",{reply,animation:inferAnimation(reply,event),provider:finalProvider,model:finalModel});
        completedStream=true;
       }
      }catch(error){
       if(!cancellation.signal.aborted){
        emit("error",{error:error instanceof OllamaError?error.message:"Error de conexión con el profesor."});
       }
      }finally{
       metrics.record({provider:finalProvider,ok:completedStream,cancelled:cancellation.signal.aborted,durationMs:Date.now()-startedMs,firstTokenMs,outputChars:full.length});
       if(!res.destroyed)res.end();
      }
      return;
     }
     const reply=normalizeReply(await llm({provider,model,messages}));
     if(!reply)throw new OllamaError("El profesor no ha respondido.",502);
     if(remember){
      memory.save(session.playerId,"user",body.text);
      memory.save(session.playerId,"assistant",reply);
     }
     return respond(res,200,{reply,animation:inferAnimation(reply,event),provider,model});
    }finally{inFlight.set(ip,Math.max(0,(inFlight.get(ip)||1)-1));}
   }
   if(req.method==="GET"&&(path==="/"||path==="/index.html"||path==="/sw.js"||/^\/assets\/[A-Za-z0-9_.-]+\.(?:js|css|woff2|png|webp|svg|glb|wasm)$/.test(path))){
    const assetPath=path==="/"||path==="/index.html"?"index.html":path.slice(1);
    try{
     const data=await readFile(join(root,"dist",assetPath));
     const ext=assetPath.split(".").at(-1);
     const type=ext==="html"?"text/html":ext==="js"?"text/javascript":ext==="css"?"text/css":ext==="svg"?"image/svg+xml":ext==="wasm"?"application/wasm":ext==="glb"?"model/gltf-binary":ext==="png"?"image/png":ext==="webp"?"image/webp":"application/octet-stream";
     res.writeHead(200,{"content-type":type+(["html","js","css","svg"].includes(ext)?"; charset=utf-8":""),"x-content-type-options":"nosniff","cache-control":assetPath.startsWith("assets/")?"public, max-age=31536000, immutable":"no-cache"});
     return res.end(data);
    }catch(error){if(error.code!=="ENOENT")throw error;}
   }
      if(req.method==="GET"&&Object.hasOwn(files,path)){
    const [name,type]=files[path],file=await readFile(join(root,"public",name));
    res.writeHead(200,{"content-type":type+"; charset=utf-8","x-content-type-options":"nosniff","cache-control":"no-cache"});
    return res.end(file);
   }
   return respond(res,404,{error:"Ruta no encontrada."});
  }catch(error){return respond(res,error instanceof OllamaError?error.status:500,{error:error instanceof OllamaError?error.message:"Error interno."});}
 });
 return {server,memory,close(){memory.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createApp(),port=Number(process.env.PORT)||3000;
 app.server.listen(port,"127.0.0.1",()=>console.log("Profesor Daskalov: http://localhost:"+port));
}
