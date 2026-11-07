import {AudioQueue} from "./audio-queue.js";
export class LocalPiperVoice{
 constructor({fetchImpl=fetch,onSpeaking=()=>{},onError=()=>{},AudioQueueFactory=options=>new AudioQueue(options)}={}){
  this.fetchImpl=fetchImpl;this.onError=onError;
  this.audio=AudioQueueFactory({onSpeaking});
  this.enabled=true;this.epoch=0;this.pending=new Set();
 }
 listVoices(){return [{name:"Piper local",lang:"es-ES",localService:true}];}
 setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.cancel();}
 setVoiceName(){}
 speak(text){
  if(!this.enabled||!String(text).trim())return false;
  const epoch=this.epoch,control=new AbortController();
  this.pending.add(control);
  (async()=>{
   const response=await this.fetchImpl("/api/tts/local",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({text:String(text).slice(0,160)}),signal:control.signal
   });
   if(!response.ok){
    let body={};try{body=await response.json();}catch{}
    throw Error(body.error||"Piper local no está disponible.");
   }
   const audio=await response.arrayBuffer();
   if(epoch!==this.epoch||control.signal.aborted)return;
   await this.audio.enqueue(audio);
  })().catch(error=>{
   if(!control.signal.aborted&&epoch===this.epoch)this.onError(error);
  }).finally(()=>this.pending.delete(control));
  return true;
 }
 cancel(){this.epoch++;for(const c of this.pending)c.abort();this.pending.clear();this.audio.cancel();}
 pause(){this.audio.pause();}
 resume(){this.audio.resume();}
}
