/** Locally sampled render timing; never stores a device ID, user identity or conversation. */
export class FpsMonitor{
 constructor({maxSamples=300}={}){this.maxSamples=maxSamples;this.samples=[];this.previous=null;}
 observe(timestampMs){
  const now=Number(timestampMs);
  if(!Number.isFinite(now))return;
  if(this.previous!==null){
   const diff=now-this.previous;
   if(diff>0&&diff<1000){
    this.samples.push(Math.min(240,1000/diff));
    if(this.samples.length>this.maxSamples)this.samples.shift();
   }
  }
  this.previous=now;
 }
 snapshot(){
  const values=[...this.samples].sort((a,b)=>a-b);
  const pick=p=>values.length?Number(values[Math.min(values.length-1,Math.ceil(values.length*p)-1)].toFixed(1)):null;
  return {samples:values.length,fpsP05:pick(.05),fpsP50:pick(.5),fpsP95:pick(.95),measuredInBrowser:true};
 }
}
