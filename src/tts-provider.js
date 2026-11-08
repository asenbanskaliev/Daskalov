export const TTS_MODES=Object.freeze(["browser","local","cloud","disabled"]);
export function createTTSProvider(mode,{browser,local,cloud}={}){
 if(!TTS_MODES.includes(mode))throw Error("TTS desconocido.");
 const disabled={available:false,voices(){return [];},synthesize(){return false;},stream:null,speak(){return false;},cancel(){},pause(){},resume(){}};
 if(mode==="disabled")return disabled;
 const selected=mode==="browser"?browser:mode==="cloud"?cloud:local;
 if(!selected)return disabled;
 return {
  available:true,
  voices(){return selected.listVoices?.()||[];},
  synthesize(text,emotion="neutral"){return selected.speak?.(text,emotion)??false;},
  stream:null,
  speak(text,emotion="neutral"){return selected.speak?.(text,emotion)??false;},
  cancel(){selected.cancel?.();},
  pause(){selected.pause?.();},
  resume(){selected.resume?.();}
 };
}
