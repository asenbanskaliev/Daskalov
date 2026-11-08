export function registerOfflineWorker(){
 if("serviceWorker" in navigator&&(location.protocol==="https:"||["localhost","127.0.0.1"].includes(location.hostname))){
  navigator.serviceWorker.register("/sw.js").catch(()=>{});
 }
}
