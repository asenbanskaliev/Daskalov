import {estimateVisemeFrames,normalizeViseme} from "./visemes.js";
export class AudioTimeline{
 constructor(){this.reset();}
 reset(){this.requestId=null;this.fragments=[];this.cancelled=false;}
 begin(requestId){
  if(typeof requestId!=="string"||requestId.length>100||!requestId)throw Error("requestId requerido.");
  this.reset();this.requestId=requestId;
 }
 append({requestId,fragmentId,text,audioStartMs,durationMs,visemes,emotion="neutral"}){
  if(this.cancelled||requestId!==this.requestId)throw Error("Audio de otra conversación.");
  if(typeof fragmentId!=="string"||!fragmentId||this.fragments.some(x=>x.fragmentId===fragmentId))throw Error("Fragmento duplicado.");
  const start=Number(audioStartMs),duration=Number(durationMs);
  const last=this.fragments.at(-1);
  if(!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<0||duration>120000||last&&start<last.audioStartMs+last.durationMs)throw Error("Tiempo de audio fuera de orden.");
  const frames=Array.isArray(visemes)&&visemes.length?
   visemes.map(v=>{
    if(!Number.isFinite(v.atMs)||v.atMs<start||v.atMs>start+duration)throw Error("Visema fuera del audio.");
    return {atMs:v.atMs,viseme:normalizeViseme(v.viseme)};
   }).sort((a,b)=>a.atMs-b.atMs):
   estimateVisemeFrames(text,duration,{startMs:start});
  const allowedEmotions=new Set(["neutral","happy","explaining","surprised","annoyed_comical"]);
  this.fragments.push({requestId,fragmentId,audioStartMs:start,durationMs:duration,frames,emotion:allowedEmotions.has(emotion)?emotion:"neutral",approximate:!visemes?.length});
  return this.fragments.at(-1);
 }
 at(timeMs){
  if(this.cancelled)return {viseme:"REST",fragment:null};
  const current=this.fragments.find(f=>timeMs>=f.audioStartMs&&timeMs<f.audioStartMs+f.durationMs);
  if(!current)return {viseme:"REST",fragment:null};
  const frame=[...current.frames].reverse().find(v=>v.atMs<=timeMs);
  return {viseme:frame?.viseme||"REST",fragment:current.fragmentId,approximate:current.approximate};
 }
 cancel(){this.fragments=[];this.cancelled=true;}
}
