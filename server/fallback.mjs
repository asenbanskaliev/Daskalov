/**
 * Explicit opt-in only. Never send local prompts to Cloud automatically.
 * Fallback is allowed only if local has yielded NO visible text.
 */
export async function* streamWithOptionalFallback({
 provider,model,messages,signal,allowFallbackToCloud=false,cloudModel="beam",
 streamLlm,reserveCloud=()=>false
}){
 if(provider!=="local"||allowFallbackToCloud!==true){
  for await(const text of streamLlm({provider,model,messages,signal}))yield {text,provider,model};
  return;
 }
 let yielded=false;
 try{
  for await(const text of streamLlm({provider,model,messages,signal})){
   yielded=true;yield {text,provider,model};
  }
  return;
 }catch(error){
  if(yielded||signal?.aborted)throw error;
  if(!reserveCloud())throw Error("No se ha autorizado el acceso a Ollama Cloud o la cuota se ha agotado.");
 }
 if(signal?.aborted)throw Error("Turno cancelado.");
 for await(const text of streamLlm({provider:"cloud",model:cloudModel,messages,signal})){
  yield {text,provider:"cloud",model:cloudModel};
 }
}
