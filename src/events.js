export class TurnTrigger {
 constructor({threshold=0.8,cooldownMs=25000}={}){this.threshold=threshold;this.cooldownMs=cooldownMs;this.armed=true;this.last=-Infinity;}
 update(yaw,now=Date.now()){
  const x=Math.abs(yaw);
  if(x<this.threshold*0.55)this.armed=true;
  if(!this.armed||x<this.threshold||now-this.last<this.cooldownMs)return false;
  this.armed=false;this.last=now;return true;
 }
}
