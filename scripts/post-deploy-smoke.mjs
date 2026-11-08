import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
/** Post-deploy smoke never sends user data, API keys, transcripts or audio. */
export async function smokeDeployment({url,expectDemo=false,fetchImpl=fetch}={}){
 const base=new URL(url||"http://127.0.0.1:3000");
 if(!["http:","https:"].includes(base.protocol)||base.username||base.password||base.search||base.hash)throw Error("Smoke URL inválida.");
 const fetchWithTimeout=(path,options={})=>fetchImpl(new URL(path,base),{...options,signal:AbortSignal.timeout(8000)});
 let health;
 for(const [path,expectType] of [["/api/health","application/json"],["/","text/html"]]){
  const response=await fetchWithTimeout(path);
  if(!response.ok||!(response.headers.get("content-type")||"").includes(expectType))throw Error("Smoke failed on "+path);
  if(!(response.headers.get("content-security-policy")||"").includes("script-src 'self'"))throw Error("Sin CSP en "+path);
  if(path==="/api/health")health=await response.json();
 }
 if(health?.ok!==true)throw Error("Servidor no saludable.");
 if(expectDemo){
  if(health.demoOnly!==true||health.cloudConfigured===true)throw Error("Modo demo no aislado.");
  // No personal data: the synthetic request must fail BEFORE any Ollama invocation.
  const chat=await fetchWithTimeout("/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"cloud",model:"beam",text:"prueba sintética"})});
  if(chat.status!==403)throw Error("La demo permite acceso a IA.");
  const session=await fetchWithTimeout("/api/session",{method:"POST"});
  if(session.status!==403)throw Error("La demo permite sesión persistente.");
 }
 return {ok:true,health:true,html:true,demoIsolation:expectDemo};
}
async function main(){
 const result=await smokeDeployment({url:process.env.DASKALOV_SMOKE_URL,expectDemo:process.env.DASKALOV_SMOKE_EXPECT_DEMO==="1"});
 process.stdout.write("Post-deploy smoke: "+JSON.stringify(result)+"\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(err=>{process.stderr.write(err.message+"\n");process.exitCode=1;});
