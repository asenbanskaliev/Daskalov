/**
 * Do not automatically repeat chargeable Cloud requests.
 * Retry local transient failures only if no text has been emitted.
 */
const RETRYABLE=/HTTP (?:429|500|502|503|504)|No se ha podido iniciar|No se ha podido conectar/i;
export async function* retryLocalStream({provider,run,signal,maxAttempts=2,delayMs=50}){
 const attempts=provider==="local"?Math.max(1,Math.min(3,maxAttempts)):1;
 for(let attempt=0;attempt<attempts;attempt++){
  let yielded=false;
  try{
   for await(const delta of run()){
    yielded=true;yield delta;
   }
   return;
  }catch(error){
   if(signal?.aborted||yielded||attempt===attempts-1||!RETRYABLE.test(String(error?.message||"")))throw error;
   if(delayMs>0){
    await new Promise((resolve,reject)=>{
     const timer=setTimeout(()=>{signal?.removeEventListener?.("abort",onAbort);resolve();},delayMs);
     const onAbort=()=>{clearTimeout(timer);reject(signal.reason||Error("Cancelled"));};
     signal?.addEventListener?.("abort",onAbort,{once:true});
    });
   }
  }
 }
}
