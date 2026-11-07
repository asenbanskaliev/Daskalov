/**
 * Configurable, conservative VAD tracker. It never treats the first short pause as
 * the end of speech. No audio bytes leave the browser through this tracker.
 */
export class VADTracker{
 constructor({threshold=.035,minSpeechMs=350,minSilenceMs=1100,maxDurationMs=12000}={}){
  this.threshold=threshold;this.minSpeechMs=minSpeechMs;this.minSilenceMs=minSilenceMs;this.maxDurationMs=maxDurationMs;
  this.startedAt=null;this.speechStartedAt=null;this.silenceAt=null;this.heardSpeech=false;this.finished=false;
 }
 feed(level,nowMs){
  if(this.startedAt===null)this.startedAt=nowMs;
  if(this.finished)return {finished:true,reason:"already"};
  if(nowMs-this.startedAt>=this.maxDurationMs){this.finished=true;return {finished:true,reason:"maximum"};}
  if(level>=this.threshold){
   this.silenceAt=null;
   this.speechStartedAt??=nowMs;
   if(nowMs-this.speechStartedAt>=this.minSpeechMs)this.heardSpeech=true;
  }else{
   // A brief noisy syllable is not enough to declare that speech happened.
   if(!this.heardSpeech)this.speechStartedAt=null;
   else{
    this.silenceAt??=nowMs;
    if(nowMs-this.silenceAt>=this.minSilenceMs){
     this.finished=true;return {finished:true,reason:"silence"};
    }
   }
  }
  return {finished:false,heardSpeech:this.heardSpeech};
 }
}
