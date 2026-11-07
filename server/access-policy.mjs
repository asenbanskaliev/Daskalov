/**
 * Cloud is a development-only feature until authenticated, audited public access exists.
 * Host headers alone are NOT identity or authorization; deployment must not rely on this
 * guard as an Internet-facing auth gateway. Server also binds loopback.
 */
export function isPrivateHost(hostHeader){
 if(typeof hostHeader!=="string"||hostHeader.length>160)return false;
 try{
  const url=new URL("http://"+hostHeader);
  return ["127.0.0.1","localhost","[::1]"].includes(url.hostname)&&!url.username&&!url.password;
 }catch{return false;}
}
export class UsageBudget{
 constructor({dailyLimit=24}={}){this.dailyLimit=dailyLimit;this.day="";this.used=0;}
 reserve(date=new Date()){
  const today=date.toISOString().slice(0,10);
  if(this.day!==today){this.day=today;this.used=0;}
  if(this.used>=this.dailyLimit)return false;
  this.used++;return true;
 }
 get remaining(){return Math.max(0,this.dailyLimit-this.used);}
}
