export const ALLOWED_GESTURES=Object.freeze(["idle","talk","ruler_desk","point_board","surprised","raise_hand"]);
const PRIORITY=Object.freeze({ambient:1,llm:2,lesson:3,player:4,safety:5});
/** Deterministic priority and cooldown; never executes untrusted animation names. */
export class GestureDirector {
 constructor({now=()=>performance.now(),defaultMs=2400}={}){
  this.now=now;this.defaultMs=defaultMs;this.active="idle";this.priority=0;this.expiresAt=-Infinity;this.source=null;
 }
 propose(gesture,{source="llm",durationMs=this.defaultMs}={}){
  if(!ALLOWED_GESTURES.includes(gesture)||!Object.hasOwn(PRIORITY,source))return false;
  const current=this.now();
  const requestedPriority=PRIORITY[source];
  if(current<this.expiresAt&&requestedPriority<this.priority)return false;
  this.active=gesture;
  this.source=source;
  this.priority=requestedPriority;
  this.expiresAt=current+Math.max(0,Math.min(5000,Number(durationMs)||0));
  return true;
 }
 current(){
  if(this.now()>=this.expiresAt)return "idle";
  return this.active;
 }
 clear(){this.active="idle";this.source=null;this.priority=0;this.expiresAt=-Infinity;}
}
