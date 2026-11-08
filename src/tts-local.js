import {AudioQueue} from "./audio-queue.js";
export class LocalPiperVoice{
 constructor({fetchImpl=fetch,onSpeaking=()=>{},onSentenceStart=()=>{},onAudioFragment=()=>{},onError=()=>{},AudioQueueFactory=options=>new AudioQueue(options),endpoint="/api/tts/local",cloudConsent=()=>false}={}){
  if(!["/api/tts/local","/api/tts/cloud"].includes(endpoint))throw Error("Endpoint TTS no reconocido.");
  this.endpoint=endpoint;this.cloudConsent=cloudConsent;
  this.fetchImpl=fetchImpl;this.onError=onError;this.onSentenceStart=onSentenceStart;
  this.audio=AudioQueueFactory({onSpeaking,onFragmentStart:onAudioFragment});
  this.enabled=true;this.epoch=0;this.pending=new Set();this.audioTail=Promise.resolve();
 }
 listVoices(){return [{name:"Piper local",lang:"es-ES",localService:true}];}
 setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.cancel();}
 setVoiceName(){}
 speak(text){
  if(!this.enabled||!String(text).trim())return false;
  if(this.endpoint==="/api/tts/cloud"&&!this.cloudConsent()){this.onError(Error("Autoriza explícitamente TTS Cloud antes de usarlo."));return false;}
  if(this.pending.size>=6){this.onError(Error("La cola de voz está llena."));return false;}
  const epoch=this.epoch,control=new AbortController();
  this.pending.add(control);
  // Fetch sentences eagerly (prebuffer), but play them in original stream order.
  const fetchStart=performance.now();
  const prebuffer=this.fetchImpl(this.endpoint,{
   method:"POST",headers:{"content-type":"application/json",...(this.endpoint==="/api/tts/cloud"?{"x-daskalov-tts-consent":"cloud"}:{})},
   body:JSON.stringify({text:String(text).slice(0,160)}),signal:control.signal
  }).then(async response=>{
   if(!response.ok){
    let body={};try{body=await response.json();}catch{}
    throw Error(body.error||"Piper local no está disponible.");
   }
   return {audio:await response.arrayBuffer(),synthesisMs:performance.now()-fetchStart};
  }).then(result=>result,error=>({error}));
  const play=this.audioTail.then(async()=>{
   const result=await prebuffer;
   if(result.error)throw result.error;
   if(epoch!==this.epoch||control.signal.aborted)return false;
   this.onSentenceStart(text);
   return this.audio.enqueue(result.audio,{text,synthesisMs:result.synthesisMs});
  });
  this.audioTail=play.catch(()=>{});
  play.catch(error=>{
   if(!control.signal.aborted&&epoch===this.epoch)this.onError(error);
  }).finally(()=>this.pending.delete(control));
  return true;
 }
 cancel(){this.epoch++;for(const c of this.pending)c.abort();this.pending.clear();this.audioTail=Promise.resolve();this.audio.cancel();}
 pause(){this.audio.pause();}
 resume(){this.audio.resume();}
}
