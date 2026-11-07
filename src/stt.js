export const STT_MODES=Object.freeze(["webSpeech","localWhisper","disabled"]);
export function createSTTAdapter({
 mode="webSpeech",
 recognitionFactory=null,
 localTranscriber=null,
 onTranscript=()=>{},
 onStatus=()=>{},
 onError=()=>{},
 onBargeIn=()=>{}
}={}){
 if(!STT_MODES.includes(mode))throw Error("Proveedor de reconocimiento de voz desconocido.");
 if(mode==="disabled")return {provider:mode,available:false,start(){return false;},stop(){},dispose(){}};
 if(mode==="localWhisper"){
  let active=false;
  return {provider:mode,available:typeof localTranscriber==="function",
   get active(){return active;},
   start(){
    if(active||typeof localTranscriber!=="function")return false;
    active=true;
    onBargeIn();onStatus("Grabando localmente… Pulsa de nuevo para transcribir.");
    Promise.resolve().then(()=>localTranscriber()).then(text=>{
     if(active&&text?.trim())onTranscript(text.trim());
    }).catch(error=>{if(active)onError(error);}).finally(()=>{active=false;onStatus("Micrófono detenido.");});
    return true;
   },
   finish(){localTranscriber?.finish?.();},
   stop(){active=false;localTranscriber?.cancel?.();onStatus("Micrófono detenido.");},
   dispose(){this.stop();}
  };
 }
 if(typeof recognitionFactory!=="function")return {provider:mode,available:false,start(){return false;},stop(){},dispose(){}};
 let recognizer;
 try{recognizer=recognitionFactory();}catch{return {provider:mode,available:false,start(){return false;},stop(){},dispose(){}};}
 recognizer.lang="es-ES";
 recognizer.interimResults=false;
 recognizer.maxAlternatives=1;
 recognizer.onresult=event=>{
  const text=event?.results?.[0]?.[0]?.transcript;
  if(typeof text==="string"&&text.trim())onTranscript(text.trim());
 };
 recognizer.onerror=event=>{onError(new Error("Reconocimiento: "+String(event?.error||"error")+"."));onStatus("Micrófono detenido.");};
 recognizer.onend=()=>onStatus("Micrófono detenido.");
 return {provider:mode,available:true,
  start(){
   try{onBargeIn();recognizer.start();onStatus("Escuchando…");return true;}
   catch(error){onError(error);return false;}
  },
  stop(){try{recognizer.abort();}finally{onStatus("Micrófono detenido.");}},
  dispose(){this.stop();}
 };
}
