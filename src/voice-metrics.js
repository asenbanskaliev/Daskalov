/** Client-only anonymous measurements. Never records text, audio or identifiers. */
export class VoiceMetrics{
 constructor({now=()=>performance.now(),limit=50}={}){
  this.now=now;this.limit=limit;this.firstAudio=[];this.rtf=[];this.gaps=[];this.cancelled=0;
  this.turnStart=null;this.firstEmitted=false;this.lastEnd=null;
 }
 add(name,value){
  if(!Number.isFinite(value)||value<0||value>120000)return;
  const values=this[name];values.push(value);
  if(values.length>this.limit)values.shift();
 }
 beginTurn(){this.turnStart=this.now();this.firstEmitted=false;this.lastEnd=null;}
 audioStart(){
  if(this.turnStart!==null&&!this.firstEmitted){
   this.add("firstAudio",this.now()-this.turnStart);this.firstEmitted=true;
  }
 }
 fragment({audioStartMs,durationMs,synthesisMs}={}){
  const start=Number(audioStartMs),duration=Number(durationMs);
  if(Number.isFinite(start)&&Number.isFinite(duration)&&duration>0){
   if(this.lastEnd!==null)this.add("gaps",Math.max(0,start-this.lastEnd));
   this.lastEnd=start+duration;
   if(Number.isFinite(synthesisMs))this.add("rtf",Math.max(0,synthesisMs)/duration);
  }
 }
 cancel(){
  if(this.turnStart!==null&&!this.firstEmitted)this.cancelled++;
  this.turnStart=null;this.firstEmitted=false;this.lastEnd=null;
 }
 snapshot(){
  const summary=values=>{
   const sorted=[...values].sort((a,b)=>a-b);
   const p=k=>sorted.length?Number(sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*k)-1)].toFixed(2)):null;
   return {samples:sorted.length,p50:p(.5),p95:p(.95)};
  };
  return {firstAudioMs:summary(this.firstAudio),ttsRealTimeFactor:summary(this.rtf),
   audioGapMs:summary(this.gaps),cancelledBeforeFirstAudio:this.cancelled,storedText:false,localOnly:true};
 }
}
