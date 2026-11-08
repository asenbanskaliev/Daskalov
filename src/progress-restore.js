/** Reads a private, session-scoped lesson snapshot with no player ID from the client. */
export async function restoreGameProgress(csrfToken,getGameUI,{fetchImpl=fetch}={}){
 if(!csrfToken||typeof getGameUI!=="function")return false;
 try{
  const response=await fetchImpl("/api/progress",{
   method:"POST",headers:{"content-type":"application/json","x-daskalov-csrf":csrfToken},
   body:JSON.stringify({readOnly:true})
  });
  if(!response.ok)return false;
  const data=await response.json();
  getGameUI()?.restore(Array.isArray(data.progress)?data.progress:[]);
  return true;
 }catch{return false;}
}
