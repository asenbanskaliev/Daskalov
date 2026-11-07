import {LocalWhisperRecorder} from "./local-stt.js";
import {createSTTAdapter} from "./stt.js";
export function configureVoiceInput({find,send,stopSpeech,showMessage}){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 let current=null,recorder=null;
 const mode=find("sttMode");
 const mic=find("micButton");
 const status=text=>{mic.textContent=text==="Escuchando…"?"Escuchando…":"Micrófono";if(find("micStatus"))find("micStatus").textContent=text;};
 const choose=()=>{
  current?.stop();
  recorder?.cancel();recorder=null;
  const selected=mode?.value||"webSpeech";
  if(selected==="localWhisper"){
   recorder=new LocalWhisperRecorder();
  }
  const transcriber=recorder?.available?()=>recorder.start():null;
  if(transcriber){transcriber.finish=()=>recorder.finish();transcriber.cancel=()=>recorder.cancel();}
  current=createSTTAdapter({
   mode:selected,
   localTranscriber:transcriber,
   recognitionFactory:Recognition?()=>new Recognition():null,
   onTranscript:send,
   onBargeIn:stopSpeech,
   onStatus:status,
   onError:error=>showMessage("error",error.message+" Puedes escribir tu pregunta.")
  });
  mic.disabled=!current.available;
  mic.title=current.available?"Activar micrófono":"Reconocimiento local no instalado o navegador no compatible. Usa el teclado.";
  status(current.available?"Micrófono apagado. No se guarda audio.":"Micrófono no disponible; usa el teclado.");
 };
 mode?.addEventListener("change",choose);
 mic.addEventListener("click",()=>{
  if(current?.provider==="localWhisper"&&current.active){current.finish();status("Transcribiendo con Whisper local…");}
  else current?.start();
 });
 choose();
 return {get available(){return Boolean(current?.available);},stop(){current?.stop();},get mode(){return current?.provider;}};
}
