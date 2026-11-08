/**
 * Development-only, user-triggered metrics. Never fetch automatically or store PII.
 */
export function configureDevMetrics({find,fetchImpl=fetch,graphicsStats=()=>null,audioStats=()=>null}){
 const details=find("devMetrics");
 const target=find("devMetricsJson");
 find("refreshMetrics").addEventListener("click",async()=>{
  target.textContent="Consultando métricas agregadas…";
  try{
   const r=await fetchImpl("/api/metrics");
   if(!r.ok)throw Error("No disponible fuera de localhost.");
   const data=await r.json();
   if(data.scope!=="anonymous-aggregate")throw Error("Métricas no autorizadas.");
   target.textContent=JSON.stringify({...data,localBrowserGraphics:graphicsStats(),localAudioTiming:audioStats()},null,2);
  }catch(error){target.textContent=error.message;}
 });
 details.addEventListener("toggle",()=>{
  // Opening the panel doesn't automatically transmit anything.
 });
 return {refreshButton:find("refreshMetrics")};
}
