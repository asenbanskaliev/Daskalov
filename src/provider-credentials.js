/** Browser-tab memory only. Keys never enter localStorage, cookies, URLs or SQLite. */
const keys=new Map();
export function isExternalProvider(provider){return provider==="openrouter"||provider==="nvidia";}
export function setProviderKey(provider,key){
 if(!isExternalProvider(provider))throw Error("Proveedor no compatible.");
 if(typeof key!=="string"||key.length<10||key.length>512||!/^[\x21-\x7e]+$/.test(key))throw Error("Clave API inválida.");
 keys.set(provider,key);
}
export function clearProviderKey(provider){keys.delete(provider);}
export function hasProviderKey(provider){return keys.has(provider);}
export function providerHeaders(provider){
 return isExternalProvider(provider)&&keys.has(provider)?{"x-daskalov-provider-key":keys.get(provider)}:{};
}
