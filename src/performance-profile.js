/**
 * Conservative adaptive pixel ratio. Decisions happen only after multiple frames,
 * so the quality doesn't fluctuate every frame. No hardware identifiers are stored.
 */
export class AdaptiveQuality {
 constructor({initial=1.25,min=.7,max=1.5,window=120}={}){
  this.ratio=initial;this.min=min;this.max=max;this.window=window;
  this.elapsed=0;this.frames=0;
 }
 sample(deltaMs){
  if(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>500)return null;
  this.elapsed+=deltaMs;this.frames++;
  if(this.frames<this.window)return null;
  const fps=1000*this.frames/this.elapsed;
  this.elapsed=0;this.frames=0;
  const previous=this.ratio;
  if(fps<33)this.ratio=Math.max(this.min,Number((this.ratio-.12).toFixed(2)));
  else if(fps>56)this.ratio=Math.min(this.max,Number((this.ratio+.06).toFixed(2)));
  return {fps,ratio:this.ratio,changed:this.ratio!==previous};
 }
}
