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
  return {provider:mode,available:typeof localTranscriber==="function",
   async start(){
    if(typeof localTranscriber!=="function")return false;
    onBargeIn();onStatus("Capturando voz local…");
    try{const text=await localTranscriber();if(text?.trim())onTranscript(text.trim());return true;}
    catch(error){onError(error);return false;}
   },stop(){},dispose(){}};
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
