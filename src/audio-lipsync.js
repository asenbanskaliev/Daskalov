import {AudioTimeline} from "./audio-timeline.js";
/** WebAudio-clock visemes; no wall clock or fixed setInterval drift. */
export class AudioLipSync {
 constructor({onViseme=()=>{}}={}){
  this.timeline=new AudioTimeline();
  this.onViseme=onViseme;
  this.clockMs=null;
  this.last="REST";
  this.generation=0;
  this.next=0;
 }
 schedule({audioStartMs,durationMs,clockMs,text="",fragmentId=null}){
  if(typeof clockMs!=="function")return false;
  if(!this.timeline.requestId||this.timeline.cancelled){
   this.timeline.begin("audio-"+(++this.generation));
   this.next=0;
  }
  const id=fragmentId||"a"+(++this.next);
  this.timeline.append({
   requestId:this.timeline.requestId,fragmentId:id,text,
   audioStartMs,durationMs
  });
  this.clockMs=clockMs;
  return true;
 }
 tick(){
  const time=this.clockMs?.();
  const viseme=Number.isFinite(time)?this.timeline.at(time).viseme:"REST";
  if(viseme!==this.last){
   this.last=viseme;
   this.onViseme(viseme);
  }
  return viseme;
 }
 cancel(){
  this.timeline.cancel();
  this.clockMs=null;
  this.last="REST";
  this.onViseme("REST");
 }
}