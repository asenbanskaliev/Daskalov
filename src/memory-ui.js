export function createMemoryUI({find,showMessage,history}){
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
   if(!state.memoryAvailable)find("remember").checked=false;
  }catch{find("remember").disabled=true;find("forgetButton").disabled=true;}
 }
 async function ensure(){
  if(csrfToken)return;
  const response=await fetch("/api/session",{method:"POST"});
  const state=await response.json();
  if(!response.ok)throw Error(state.error||"Memoria no disponible.");
  csrfToken=state.csrfToken;find("forgetButton").disabled=false;
 }
 async function forget(){
  if(!csrfToken){showMessage("assistant","No hay sesión de memoria activa.");return;}
  try{
   const res=await fetch("/api/memory",{method:"DELETE",headers:{"content-type":"application/json","x-daskalov-csrf":csrfToken},body:"{}"});
   if(!res.ok)throw Error("No se pudo borrar la memoria.");
   csrfToken=null;history.length=0;find("remember").checked=false;find("forgetButton").disabled=true;
   showMessage("assistant","Los recuerdos guardados se han borrado.");
  }catch(error){showMessage("error",error.message);}
 }
 function bind(){
  find("remember").addEventListener("change",async()=>{
   if(!find("remember").checked)return;
   try{await ensure();}catch(error){find("remember").checked=false;showMessage("error",error.message);}
  });
  find("forgetButton").addEventListener("click",forget);
 }
 return {bind,refresh,ensure,forget,get csrfToken(){return csrfToken;}};
}
