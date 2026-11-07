export class BrowserSpeechQueue {
 constructor({synthesis=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,onSpeaking=()=>{}}={}){
  this.synthesis=synthesis;
  this.Utterance=Utterance;
  this.onSpeaking=onSpeaking;
  this.enabled=true;
  this.voiceName="";
  this.generation=0;
 }
 setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.cancel();}
 listVoices(){return (this.synthesis?.getVoices?.()||[]).filter(voice=>String(voice.lang).toLowerCase().startsWith("es"));}
 setVoiceName(name){this.voiceName=String(name||"");}
 pause(){this.synthesis?.pause?.();this.onSpeaking(false);}
 resume(){if(!this.enabled)return;this.synthesis?.resume?.();this.onSpeaking(true);}
 cancel(){
  this.generation++;
  this.synthesis?.cancel?.();
  this.onSpeaking(false);
 }
 speak(sentence){
  if(!this.enabled||!this.synthesis||!this.Utterance)return false;
  const utterance=new this.Utterance(String(sentence));
  utterance.lang="es-ES";
  utterance.rate=0.94;
  utterance.pitch=0.88;
  const voices=this.listVoices();
  const selected=voices.find(voice=>voice.name===this.voiceName)||voices[0];
  if(selected)utterance.voice=selected;
  const revision=this.generation;
  utterance.onstart=()=>{if(this.generation===revision)this.onSpeaking(true);};
  utterance.onend=utterance.onerror=()=>{if(this.generation===revision)this.onSpeaking(false);};
  this.synthesis.speak(utterance);
  return true;
 }
}
