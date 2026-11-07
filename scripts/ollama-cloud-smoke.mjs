import {once} from "node:events";
import {createApp} from "../server/main.mjs";

if(!process.env.OLLAMA_API_KEY){
 console.error("OLLAMA_API_KEY no está disponible en este job.");process.exitCode=1;
}else{
 const app=createApp({dbPath:":memory:",allowMemory:true});
 const model=process.env.OLLAMA_CLOUD_MODEL||"beam";
 const started=Date.now();
 app.server.listen(0,"127.0.0.1");
 await once(app.server,"listening");
 const base="http://127.0.0.1:"+app.server.address().port;
 let cookie="",csrfToken="";

 const post=async(path,body,method="POST")=>{
  const response=await fetch(base+path,{method,headers:{"content-type":"application/json",...(cookie?{cookie}:{}),...(csrfToken?{"x-daskalov-csrf":csrfToken}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(110000)});
  const json=await response.json();
  if(!response.ok)throw new Error("HTTP "+response.status+" from "+path+": "+json.error);
  return json;
 };
 try{
  const session=await fetch(base+"/api/session",{method:"POST"});
  if(!session.ok)throw new Error("No se pudo crear sesión privada");
  csrfToken=(await session.json()).csrfToken;
  cookie=session.headers.get("set-cookie").split(";")[0];
  const reply=await post("/api/chat",{
   provider:"cloud",
   model,
   event:"turned_around",
   text:"Profesor, me he girado para hablar con mi compañero. ¿Cómo era eso en tus tiempos?",
   remember:true,
   history:[]
  });
  if(typeof reply.reply!=="string"||reply.reply.trim().length<2)throw new Error("La IA no generó voz textual.");
  if(reply.animation!=="ruler_desk")throw new Error("No se asignó el gesto esperado.");
  const before=await post("/api/memory",{});
  if(before.memories?.length!==2)throw new Error("La memoria no almacenó ambos turnos.");
  const oldCookie=cookie;
  await post("/api/memory",{},"DELETE");
  cookie="";csrfToken="";
  const afterResponse=await fetch(base+"/api/session",{headers:{cookie:oldCookie}});
  const after=await afterResponse.json();
  if(after.active!==false)throw new Error("La sesión de memoria no se revocó.");
  console.log("PASS E2E: Ollama Cloud "+model+", personaje Daskalov, gesto, SQL y borrado; elapsed_ms="+(Date.now()-started)+", reply_chars="+reply.reply.length);
 }catch(error){
  console.error("FAIL: integración E2E Cloud: "+error.name+" "+error.message);
  process.exitCode=1;
 }finally{
  await new Promise(done=>app.server.close(done));
  app.close();
 }
}
