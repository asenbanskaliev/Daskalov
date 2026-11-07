export function configureVoiceInput({find,send,stopSpeech,showMessage}){
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition){
  find("micButton").disabled=true;
  find("micButton").title="No está disponible el reconocimiento de voz. Puedes escribir tu pregunta.";
  return {stop(){}};
 }
 const recognition=new SpeechRecognition();
 recognition.lang="es-ES";recognition.interimResults=false;recognition.maxAlternatives=1;
 recognition.onresult=e=>send(e.results[0][0].transcript);
 recognition.onerror=e=>showMessage("error","Micrófono: "+e.error+". Puedes escribir tu pregunta.");
 recognition.onend=()=>{find("micButton").textContent="Micrófono";find("micStatus")?.replaceChildren(document.createTextNode("Micrófono detenido."));};
 find("micButton").addEventListener("click",()=>{
  try{
   stopSpeech();
   recognition.start();
   find("micButton").textContent="Escuchando…";
   const micStatus=find("micStatus");if(micStatus)micStatus.textContent="Escuchando por micrófono…";
  }catch{showMessage("error","No se pudo iniciar el micrófono.");}
 });
 return {stop(){recognition.abort();}};
}
