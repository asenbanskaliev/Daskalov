export const TTS_MODES=Object.freeze(["browser","local","disabled"]);
export function createTTSProvider(mode,{browser,local}={}){
 if(!TTS_MODES.includes(mode))throw Error("TTS desconocido.");
 const disabled={available:false,voices(){return [];},speak(){return false;},cancel(){},pause(){},resume(){}};
 if(mode==="disabled")return disabled;
 const selected=mode==="browser"?browser:local;
 if(!selected)return disabled;
 return {
  available:true,
  voices(){return selected.listVoices?.()||[];},
  speak(text,emotion="neutral"){return selected.speak?.(text,emotion)??false;},
  cancel(){selected.cancel?.();},
  pause(){selected.pause?.();},
  resume(){selected.resume?.();}
 };
}
