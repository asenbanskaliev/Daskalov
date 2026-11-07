/**
 * Browser AudioContext queue. Decodes locally and serializes playback to prevent overlap.
 * Cancelling a turn aborts pending and active playback.
 */
export class AudioQueue {
 constructor({AudioContextCtor=globalThis.AudioContext||globalThis.webkitAudioContext,onSpeaking=()=>{}}={}){
  this.Ctor=AudioContextCtor;this.onSpeaking=onSpeaking;this.ctx=null;this.generation=0;this.tail=Promise.resolve();this.sources=new Set();this.pending=new Set();
 }
 async enqueue(buffer){
  if(!this.Ctor)throw Error("AudioContext no disponible.");
  const version=this.generation;
  const play=async()=>{
   if(version!==this.generation)return false;
   this.ctx??=new this.Ctor();
   await this.ctx.resume?.();
   const audio=await this.ctx.decodeAudioData(buffer.slice(0));
   if(version!==this.generation)return false;
   return new Promise((resolve,reject)=>{
    const source=this.ctx.createBufferSource();source.buffer=audio;
    source.connect(this.ctx.destination);
    let finished=false;
    const finish=()=>{
     if(finished)return;
     finished=true;
     this.sources.delete(source);this.pending.delete(finish);
     this.onSpeaking(false);resolve(true);
    };
    source.onended=finish;
    this.sources.add(source);this.pending.add(finish);
    try{this.onSpeaking(true);source.start();}catch(error){finish();reject(error);}
   });
  };
  const current=this.tail.then(play,play);
  this.tail=current.catch(()=>{});
  return current;
 }
 async pause(){await this.ctx?.suspend?.();this.onSpeaking(false);}
 async resume(){await this.ctx?.resume?.();if(this.sources.size)this.onSpeaking(true);}
 cancel(){
  this.generation++;
  for(const source of this.sources){try{source.stop();}catch{}}
  for(const finish of [...this.pending])finish();
  this.sources.clear();this.pending.clear();this.tail=Promise.resolve();
  this.onSpeaking(false);
 }
 async close(){this.cancel();await this.ctx?.close?.();this.ctx=null;}
}
