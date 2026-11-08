/** AnimationMixer delta driven by actual WebAudio currentTime when speaking. */
export class AudioMixerClock{
 constructor(){this.clock=null;this.previous=null;}
 setClock(clock){this.clock=typeof clock==="function"?clock:null;this.previous=null;}
 step(rafDeltaSeconds,speaking){
  const fallback=Number.isFinite(rafDeltaSeconds)?Math.max(0,Math.min(.1,rafDeltaSeconds)):0;
  if(!speaking||!this.clock){this.previous=null;return fallback;}
  const now=this.clock();
  if(!Number.isFinite(now)||now<0){this.previous=null;return fallback;}
  if(this.previous===null){this.previous=now;return 0;}
  const diff=now-this.previous;this.previous=now;
  if(diff<0||diff>500)return 0;
  return Math.min(.1,diff/1000);
 }
 reset(){this.clock=null;this.previous=null;}
}
