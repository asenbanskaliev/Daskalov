export function createMemoryUI({find,showMessage,history,onSession=()=>{}}){
 let csrfToken=null;
 async function refresh(){
  try{
   const r=await fetch("/api/session");
   if(!r.ok)throw Error("Privacidad no disponible.");
   const state=await r.json();
   csrfToken=state.active?state.csrfToken:null;
   find("remember").disabled=!state.memoryAvailable;
   find("remember").title=state.memoryAvailable?"Memoria opcional en este servidor privado":"Memoria desactivada en este servidor.";
   find("forgetButton").disabled=!state.active;
   find("viewMemories").disabled=!state.active;
   find("exportMemories").disabled=!state.active;
   if(!state.memoryAvailable)find("remember").checked=false;
  }catch{find("remember").disabled=true;find("forgetButton").disabled=true;}
 }
 async function ensure(){
  if(csrfToken){await onSession(csrfToken);return;}
  const response=await fetch("/api/session",{method:"POST"});
  const state=await response.json();
  if(!response.ok)throw Error(state.error||"Memoria no disponible.");
  csrfToken=state.csrfToken;find("forgetButton").disabled=false;
  find("viewMemories").disabled=false;find("exportMemories").disabled=false;
  await onSession(csrfToken);
 }
 async function forget(){
  if(!csrfToken){showMessage("assistant","No hay sesión de memoria activa.");return;}
  try{
   const res=await fetch("/api/memory",{method:"DELETE",headers:{"content-type":"application/json","x-daskalov-csrf":csrfToken},body:"{}"});
   if(!res.ok)throw Error("No se pudo borrar la memoria.");
   csrfToken=null;history.length=0;find("remember").checked=false;find("forgetButton").disabled=true;
   find("viewMemories").disabled=true;find("exportMemories").disabled=true;find("memoryDetails").hidden=true;
   showMessage("assistant","Los recuerdos guardados se han borrado.");
  }catch(error){showMessage("error",error.message);}
 }
 async function queryExport(){
  if(!csrfToken)throw Error("Primero debes habilitar la memoria privada.");
  const res=await fetch("/api/memory/export",{method:"POST",headers:{"content-type":"application/json","x-daskalov-csrf":csrfToken},body:"{}"});
  if(!res.ok)throw Error("No se pudieron consultar tus datos.");
  return res.json();
 }
 async function showDetails(){
  try{
   const data=await queryExport(),container=find("memoryEntries");
   container.replaceChildren();
   for(const memory of data.memories){
    const row=document.createElement("div");row.className="memory-entry";
    const input=document.createElement("textarea");input.value=memory.content;input.maxLength=1500;
    input.setAttribute("aria-label","Contenido de recuerdo "+memory.id);
    const button=document.createElement("button");button.textContent="Guardar corrección";button.type="button";
    button.addEventListener("click",async()=>{
     try{
      const res=await fetch("/api/memory/correct",{method:"POST",headers:{"content-type":"application/json","x-daskalov-csrf":csrfToken},body:JSON.stringify({id:memory.id,content:input.value})});
      if(!res.ok)throw Error("No se pudo corregir este recuerdo.");
      showMessage("assistant","Recuerdo corregido.");
     }catch(error){showMessage("error",error.message);}
    });
    row.append(input,button);container.append(row);
   }
   if(!data.memories.length)container.textContent="Todavía no hay recuerdos guardados.";
   find("memoryDetails").hidden=false;
  }catch(error){showMessage("error",error.message);}
 }
 async function exportData(){
  try{
   const data=await queryExport();
   const file=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
   const objectUrl=URL.createObjectURL(file),anchor=document.createElement("a");
   anchor.href=objectUrl;anchor.download="daskalov-mis-datos.json";
   document.body.append(anchor);anchor.click();anchor.remove();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  }catch(error){showMessage("error",error.message);}
 }
 function bind(){
  find("remember").addEventListener("change",async()=>{
   if(!find("remember").checked)return;
   try{await ensure();}catch(error){find("remember").checked=false;showMessage("error",error.message);}
  });
  find("forgetButton").addEventListener("click",forget);
  find("viewMemories").addEventListener("click",showDetails);
  find("exportMemories").addEventListener("click",exportData);
 }
 return {bind,refresh,ensure,forget,showDetails,exportData,get csrfToken(){return csrfToken;}};
}
