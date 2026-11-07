const url=process.env.DASKALOV_SMOKE_URL||"http://127.0.0.1:3000";
const base=new URL(url);
if(!["http:","https:"].includes(base.protocol)||base.username||base.password)throw Error("Smoke URL inválida.");
for(const [path,expectType] of [["/api/health","application/json"],["/","text/html"]]){
 const r=await fetch(new URL(path,base),{signal:AbortSignal.timeout(8000)});
 if(!r.ok||!(r.headers.get("content-type")||"").includes(expectType))throw Error("Smoke failed on "+path);
 if(!(r.headers.get("content-security-policy")||"").includes("script-src 'self'"))throw Error("Sin CSP.");
 if(path==="/api/health"&&!(await r.json()).ok)throw Error("Servidor no saludable.");
}
console.log("Post-deploy smoke: API health and static HTML pass");
