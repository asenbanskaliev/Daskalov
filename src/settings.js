import {isExternalProvider,setProviderKey,clearProviderKey,hasProviderKey,providerHeaders} from "./provider-credentials.js";
export function readSetting(key,storage=globalThis.localStorage){
 try{return storage?.getItem("daskalov_"+key)||null;}catch{return null;}
}
export function writeSetting(key,value,storage=globalThis.localStorage){
 try{storage?.setItem("daskalov_"+key,String(value));}catch{}
}
export function createSettingsUI({find,showMessage,fetchImpl=fetch}){
 let catalog=[],latest=0;
 const provider=()=>find("provider").value;
 function showKeyStatus(){
  const selected=provider(),enabled=isExternalProvider(selected);
  find("providerKeyRow").hidden=!enabled;
  const keyLink=find("providerKeyLink");
  keyLink.href=selected==="nvidia"?"https://build.nvidia.com/":"https://openrouter.ai/settings/keys";
  find("freeOnlyRow").hidden=selected!=="openrouter";
  if(selected!=="openrouter")find("freeOnlyModels").checked=false;
  find("providerKeyStatus").textContent=!enabled?"":hasProviderKey(selected)?
   "Clave activa solo mientras permanezca abierta esta pestaña.":"Introduce la API key y pulsa Aplicar clave.";
 }
 function populateCatalog(search=""){
  const picker=find("modelPicker");
  picker.replaceChildren();
  const names=catalog.filter(x=>x.toLowerCase().includes(search.toLowerCase())&&(!find("freeOnlyModels").checked||x.endsWith(":free"))).slice(0,600);
  const empty=document.createElement("option");
  empty.value="";empty.textContent=names.length?"Elegir entre "+names.length+" modelos":"No hay coincidencias";
  picker.append(empty);
  for(const name of names){
   const option=document.createElement("option");option.value=name;option.textContent=name;picker.append(option);
  }
  picker.value=names.includes(find("model").value)?find("model").value:"";
 }
 function selectModel(value){
  if(!value)return;
  find("model").value=value;
  writeSetting("model",value);
  writeSetting("model_"+provider(),value);
 }
 async function refreshProviderStatus(){
  const target=find("providerStatus"),selected=provider();
  const fallback=find("cloudFallbackRow");
  if(fallback){fallback.hidden=selected!=="local";if(selected!=="local")find("cloudFallback").checked=false;}
  showKeyStatus();
  if(selected==="demo"){target.textContent="Sin IA · demo offline";return;}
  if(isExternalProvider(selected)&&!hasProviderKey(selected)){
   target.textContent="Introduce la clave API para conectar y listar modelos.";
   return;
  }
  target.textContent="Comprobando "+selected+"…";
  try{
   const response=await fetchImpl("/api/provider-status?provider="+encodeURIComponent(selected),{headers:providerHeaders(selected)});
   const data=await response.json();
   if(provider()!==selected)return;
   target.textContent=data.reachable?"Conectado · "+data.models+" modelos":"No se pudo conectar: revisa la API key y el acceso.";
  }catch{if(provider()===selected)target.textContent="Conexión no disponible.";}
 }
 async function refreshModels(){
  const selected=provider(),callId=++latest;
  showKeyStatus();catalog=[];
  find("modelsList").replaceChildren();
  find("modelSearch").value="";
  find("modelPickerRow").hidden=selected==="demo";
  find("model").disabled=selected==="demo";
  populateCatalog();
  if(selected==="demo"){find("model").value="";await refreshProviderStatus();return;}
  if(isExternalProvider(selected)&&!hasProviderKey(selected)){
   find("model").value="";await refreshProviderStatus();return;
  }
  const previous=readSetting("model_"+selected);
  if(previous)find("model").value=previous;
  else if(selected==="cloud"&&!find("model").value)find("model").value="beam";
  else if(selected!=="cloud"&&find("model").value==="beam")find("model").value="";
  try{
   const r=await fetchImpl("/api/models?provider="+encodeURIComponent(selected),{headers:providerHeaders(selected)});
   const data=await r.json();
   if(!r.ok)throw Error(data.error||"Catálogo no disponible");
   if(provider()!==selected||callId!==latest)return;
   catalog=Array.isArray(data.models)?data.models:[];
   for(const name of catalog){
    const option=document.createElement("option");option.value=name;find("modelsList").append(option);
   }
   if(catalog.length&&!catalog.includes(find("model").value))selectModel(catalog[0]);
   populateCatalog();
   if(!catalog.length)showMessage("error","No hay modelos de texto compatibles con este proveedor.");
  }catch(error){
   if(provider()===selected&&callId===latest)showMessage("error","No fue posible listar modelos: "+error.message);
  }
  if(provider()===selected&&callId===latest)await refreshProviderStatus();
 }
 find("saveProviderKey").addEventListener("click",async()=>{
  const input=find("providerApiKey");
  try{
   setProviderKey(provider(),input.value.trim());
   input.value="";
   showKeyStatus();
   await refreshModels();
  }catch(error){find("providerKeyStatus").textContent=error.message;}
 });
 find("forgetProviderKey").addEventListener("click",()=>{
  clearProviderKey(provider());
  find("providerApiKey").value="";find("model").value="";
  catalog=[];populateCatalog();showKeyStatus();refreshProviderStatus();
 });
 find("modelPicker").addEventListener("change",()=>selectModel(find("modelPicker").value));
 find("modelSearch").addEventListener("input",()=>populateCatalog(find("modelSearch").value));
 find("freeOnlyModels").addEventListener("change",()=>populateCatalog(find("modelSearch").value));
 find("refreshModels").addEventListener("click",refreshModels);
 find("model").addEventListener("change",()=>{
  writeSetting("model_"+provider(),find("model").value);populateCatalog(find("modelSearch").value);
 });
 async function checkHealth(){
  try{
   const response=await fetchImpl("/api/health"),data=await response.json();
   find("apiDot").classList.toggle("ok",Boolean(data.ok));
   find("apiStatus").textContent=data.demoOnly?"Demo segura sin IA":data.ok?"Servidor conectado"+(data.cloudConfigured?" · Ollama Cloud configurado":""):"Servidor desconectado";
   if(data.demoOnly){find("provider").value="demo";find("provider").dispatchEvent(new Event("change"));}
  }catch{find("apiStatus").textContent="Servidor desconectado";}
 }
 showKeyStatus();
 return {refreshModels,refreshProviderStatus,checkHealth};
}
