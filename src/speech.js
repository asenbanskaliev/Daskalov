export class BrowserSpeechQueue {
 constructor({synthesis=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,onSpeaking=()=>{}}={}){
  this.synthesis=synthesis;
  this.Utterance=Utterance;
  this.onSpeaking=onSpeaking;
  this.enabled=true;
  this.generation=0;
 }
 setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.cancel();}
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
  const voices=this.synthesis.getVoices?.()||[];
  const spanish=voices.find(voice=>String(voice.lang).toLowerCase().startsWith("es"));
  if(spanish)utterance.voice=spanish;
  const revision=this.generation;
  utterance.onstart=()=>{if(this.generation===revision)this.onSpeaking(true);};
  utterance.onend=utterance.onerror=()=>{if(this.generation===revision)this.onSpeaking(false);};
  this.synthesis.speak(utterance);
  return true;
 }
}
