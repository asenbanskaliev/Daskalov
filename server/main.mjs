import http from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import {createMessages,normalizeReply,inferAnimation} from "./personality.mjs";
import {chatOllama,listOllamaModels,OllamaError,validateModel,validateProvider} from "./ollama.mjs";
import {openMemory,isPlayerId} from "./memory.mjs";
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const files={"/":["index.html","text/html"],"/index.html":["index.html","text/html"],"/style.css":["style.css","text/css"],"/app.js":["app.js","text/javascript"],"/events.js":["events.js","text/javascript"]};
function respond(res,status,payload){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});res.end(JSON.stringify(payload));}
async function bodyOf(req){
 if(!req.headers["content-type"]?.startsWith("application/json"))throw new OllamaError("Se requiere JSON.",415);
 let input="";for await(const chunk of req){input+=chunk;if(input.length>12000)throw new OllamaError("Mensaje demasiado grande.",413);}
 try{return JSON.parse(input);}catch{throw new OllamaError("JSON inválido.",400);}
}
export function createApp({dbPath=join(root,"server","data","daskalov.sqlite"),llm=chatOllama,models=listOllamaModels}={}){
 const memory=openMemory(dbPath);memory.cleanup();
 const rate=new Map();
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/","http://localhost"),path=url.pathname;
  try{
   if(path==="/api/health"&&req.method==="GET")return respond(res,200,{ok:true,cloudConfigured:!!process.env.OLLAMA_API_KEY});
   if(path==="/api/models"&&req.method==="GET")return respond(res,200,{models:await models({provider:validateProvider(url.searchParams.get("provider"))})});
   if(path==="/api/memory"&&["POST","DELETE"].includes(req.method)){
    const body=await bodyOf(req);if(!isPlayerId(body.playerId))throw new OllamaError("Alumno inválido.",400);
    if(req.method==="DELETE"){memory.deletePlayer(body.playerId);return respond(res,200,{deleted:true});}
    return respond(res,200,{memories:memory.list(body.playerId)});
   }
   if(path==="/api/chat"&&req.method==="POST"){
    const ip=req.socket.remoteAddress||"unknown",now=Date.now();
    const times=(rate.get(ip)||[]).filter(t=>now-t<60000);
    if(times.length>=12)throw new OllamaError("Demasiadas preguntas: inténtalo en un minuto.",429);
    times.push(now);rate.set(ip,times);
    const body=await bodyOf(req),provider=validateProvider(body.provider),model=validateModel(body.model);
    if(typeof body.text!=="string"||!body.text.trim()||body.text.length>700)throw new OllamaError("Mensaje inválido (1-700 caracteres).",400);
    const event=["dialog","turned_around","interruption","long_silence"].includes(body.event)?body.event:"dialog";
    const remember=body.remember===true;
    if(remember&&!isPlayerId(body.playerId))throw new OllamaError("Identificador de memoria inválido.",400);
    const memories=remember?memory.search(body.playerId,body.text):[];
    const messages=createMessages({text:body.text,event,memories,history:body.history});
    const reply=normalizeReply(await llm({provider,model,messages}));
    if(!reply)throw new OllamaError("El profesor no ha respondido.",502);
    if(remember){memory.save(body.playerId,"user",body.text);memory.save(body.playerId,"assistant",reply);}
    return respond(res,200,{reply,animation:inferAnimation(reply,event),provider,model});
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
