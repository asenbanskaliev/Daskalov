export function readSetting(key,storage=globalThis.localStorage){
 try{return storage?.getItem("daskalov_"+key)||null;}catch{return null;}
}
export function writeSetting(key,value,storage=globalThis.localStorage){
 try{storage?.setItem("daskalov_"+key,String(value));}catch{}
}
export function createSettingsUI({find,showMessage}){
 async function refreshProviderStatus(){
  const target=find("providerStatus");
  if(!target)return;
  const provider=find("provider").value;
  const row=find("cloudFallbackRow");
  if(row){row.hidden=provider!=="local";if(provider!=="local")find("cloudFallback").checked=false;}
  if(provider==="demo"){target.textContent="Sin IA · demostración offline";return;}
  target.textContent="Comprobando "+(provider==="cloud"?"Cloud":"Ollama local")+"…";
  try{
   const response=await fetch("/api/provider-status?provider="+encodeURIComponent(provider));
   const data=await response.json();
   if(find("provider").value!==provider)return;
   target.textContent=data.reachable?"Conectado · "+data.models+" modelos disponibles":"No disponible. Revisa el servidor.";
  }catch{target.textContent="Conexión no disponible.";}
 }
 async function refreshModels(){
  const provider=find("provider").value;
  if(provider==="demo"){
   find("model").disabled=true;find("model").value="";find("modelsList").replaceChildren();
   await refreshProviderStatus();
   return;
  }
  find("model").disabled=false;
  if(provider==="local"&&find("model").value==="beam")find("model").value="";
  if(provider==="cloud"&&!find("model").value)find("model").value="beam";
  try{
   const r=await fetch("/api/models?provider="+encodeURIComponent(provider));
   const data=await r.json();
   if(!r.ok)throw Error(data.error||"Modelos no disponibles");
   if(find("provider").value!==provider)return;
   find("modelsList").replaceChildren();
   for(const name of data.models){
    const option=document.createElement("option");option.value=name;find("modelsList").append(option);
   }
   if(data.models.length&&!data.models.includes(find("model").value)){
    find("model").value=data.models[0];writeSetting("model",find("model").value);
   }
   if(!data.models.length)showMessage("error","No hay modelos disponibles para este proveedor.");
  }catch(error){showMessage("error",error.message||"No fue posible consultar modelos.");}
  await refreshProviderStatus();
 }
 async function checkHealth(){
  try{
   const response=await fetch("/api/health"),data=await response.json();
   find("apiDot").classList.toggle("ok",Boolean(data.ok));
   find("apiStatus").textContent=data.ok?"Servidor conectado"+(data.cloudConfigured?" · Cloud configurado":" · Cloud sin clave"):"Servidor desconectado";
  }catch{find("apiStatus").textContent="Servidor desconectado";}
 }
 return {refreshModels,refreshProviderStatus,checkHealth};
}
