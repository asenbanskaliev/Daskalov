import {chromium,firefox} from "@playwright/test";
import {writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

export function summarizeHardwareFps({frames,durationMs,sha,browser,deviceTier,quality,resolution}){
 if(!Array.isArray(frames)||frames.length<100||!Number.isFinite(durationMs)||durationMs<300000)throw Error("Faltan cinco minutos de fotogramas reales.");
 if(!/^[a-f0-9]{40}$/i.test(sha||""))throw Error("SHA exacto obligatorio.");
 if(!["chrome","edge","firefox"].includes(browser)||!["normal","low"].includes(deviceTier)||
    !["low","medium","high","auto"].includes(quality)||!/^\d{3,4}x\d{3,4}$/.test(resolution))throw Error("Perfil de benchmark no permitido.");
 if(frames.some(delta=>!Number.isFinite(delta)||delta<=0||delta>1000))throw Error("Fotogramas incorrectos.");
 const fps=frames.map(delta=>Math.min(240,1000/delta)).sort((a,b)=>a-b);
 const percentile=p=>Number(fps[Math.min(fps.length-1,Math.ceil(fps.length*p)-1)].toFixed(2));
 return {
  schema:"daskalov-hardware-perf-v1",sha,browser,deviceTier,quality,resolution,benchmarkId:"classroom-5m",
  durationMs,samples:fps.length,fpsP05:percentile(.05),fpsP50:percentile(.5),
  firstAudioP50Ms:null,firstAudioP95Ms:null,
  renderBudgetTargetFps:deviceTier==="normal"?55:30,
  renderTargetObserved:percentile(.5)>=(deviceTier==="normal"?55:30),
  exactBrowserBuildNotAttested:true,independentHardwareEvidenceVerified:false,releaseApproved:false,
  note:"Measured browser rAF frame intervals; no GPU VRAM data, real microphone, Ollama model or device identifiers."
 };
}
export async function collectLocalHardwareFps({browser,deviceTier,quality,resolution,sha,consent=process.env.DASKALOV_HARDWARE_BENCH_CONSENT}){
 if(consent!=="1")throw Error("Se requiere autorización para medir el navegador físico.");
 const [width,height]=String(resolution).split("x").map(Number);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<320||width>3840||height<320||height>2160)throw Error("Resolución no admitida.");
 // Validate arguments before starting any actual browser.
 summarizeHardwareFps({frames:Array(100).fill(16),durationMs:300000,sha,browser,deviceTier,quality,resolution});
 const engine=browser==="firefox"?firefox:chromium;
 const opts={headless:false,...(browser==="firefox"?{}:{channel:browser==="edge"?"msedge":"chrome"})};
 const runner=await engine.launch(opts);
 try{
  const page=await runner.newPage({viewport:{width,height}});
  // No user content, model queries or paid APIs during a graphics benchmark.
  await page.route("**/api/**",route=>{
   const isHealth=new URL(route.request().url()).pathname==="/api/health";
   return route.fulfill({status:isHealth?200:403,contentType:"application/json",
    body:JSON.stringify(isHealth?{ok:true,demoOnly:true,cloudConfigured:false}:{error:"Benchmark aislado"})});
  });
  await page.goto("http://127.0.0.1:3000/",{waitUntil:"domcontentloaded"});
  await page.locator("#graphicsQuality").selectOption(quality);
  await page.locator("#provider").selectOption("demo");
  await page.locator("#sceneStatus").filter({hasText:"personaje GLB local cargado"}).waitFor({timeout:20000});
  const start=Date.now();
  const frames=await page.evaluate(()=>new Promise(resolve=>{
   const values=[],started=performance.now();
   let previous=null;
   function tick(now){
    if(previous!==null&&now>previous)values.push(now-previous);
    previous=now;
    if(now-started>=300000){resolve(values);return;}
    requestAnimationFrame(tick);
   }
   requestAnimationFrame(tick);
  }));
  return summarizeHardwareFps({frames,durationMs:Date.now()-start,sha,browser,deviceTier,quality,resolution});
 }finally{await runner.close();}
}
async function cli(){
 const [browser,deviceTier,quality,resolution,output]=process.argv.slice(2);
 if(!output)throw Error("Uso: browser normal|low low|medium|high|auto 1280x720 output.json");
 const report=await collectLocalHardwareFps({browser,deviceTier,quality,resolution,
  sha:process.env.DASKALOV_EXPECTED_SHA});
 await writeFile(resolve(output),JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write("FPS medidos en navegador local. Requiere revisión independiente; no supone release aprobado.\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)cli().catch(e=>{process.stderr.write(e.message+"\n");process.exitCode=1;});
