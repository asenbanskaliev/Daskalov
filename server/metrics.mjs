function percentile(values,p){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 return sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];
}
export class MetricsCollector{
 constructor({retainedSamples=100,cloudUsdPerMillionOutputTokens=null}={}){
  this.retainedSamples=retainedSamples;
  this.rate=Number.isFinite(Number(cloudUsdPerMillionOutputTokens))&&cloudUsdPerMillionOutputTokens!==null?Math.max(0,Number(cloudUsdPerMillionOutputTokens)):null;
  this.data={cloud:{ok:0,errors:0,cancelled:0,samples:[],outputChars:0,estimatedTokens:0},local:{ok:0,errors:0,cancelled:0,samples:[],outputChars:0,estimatedTokens:0}};
  this.stages={db:[],tts:[],stt:[],firstAudio:[],audioGap:[]};
  this.activeRequests=0;this.peakRequests=0;
 }
 record({provider,ok=false,cancelled=false,durationMs=0,firstTokenMs=null,outputChars=0}){
  if(!Object.hasOwn(this.data,provider))return;
  const d=this.data[provider];
  if(cancelled)d.cancelled++;else if(ok)d.ok++;else d.errors++;
  const chars=Math.max(0,Math.min(6000,Math.floor(Number(outputChars)||0)));
  d.outputChars+=chars;
  d.estimatedTokens+=Math.ceil(chars/4);
  d.samples.push({duration:Math.max(0,Math.floor(Number(durationMs)||0)),first:firstTokenMs===null?null:Math.max(0,Math.floor(Number(firstTokenMs)||0))});
  if(d.samples.length>this.retainedSamples)d.samples.shift();
 }
 observe(stage,durationMs){
  if(!Object.hasOwn(this.stages,stage))return false;
  const value=Number(durationMs);
  if(!Number.isFinite(value)||value<0||value>120000)return false;
  const samples=this.stages[stage];
  samples.push(Math.round(value));
  if(samples.length>this.retainedSamples)samples.shift();
  return true;
 }
 active(count){
  this.activeRequests=Math.min(100000,Math.max(0,Math.trunc(Number(count)||0)));
  this.peakRequests=Math.max(this.peakRequests,this.activeRequests);
 }
 snapshot(){
  const providers={};
  for(const [provider,d] of Object.entries(this.data)){
   const first=d.samples.map(x=>x.first).filter(x=>x!==null);
   providers[provider]={
    requests:d.ok+d.errors+d.cancelled,
    successes:d.ok,failures:d.errors,cancelled:d.cancelled,
    durationP50Ms:percentile(d.samples.map(x=>x.duration),.5),
    durationP95Ms:percentile(d.samples.map(x=>x.duration),.95),
    firstTokenP50Ms:percentile(first,.5),
    firstTokenP95Ms:percentile(first,.95),
    outputTokensEstimated:d.estimatedTokens,
    costUsdEstimated:provider==="cloud"&&this.rate!==null?Number((d.estimatedTokens*this.rate/1e6).toFixed(6)):null
   };
  }
  const services=Object.fromEntries(Object.entries(this.stages).map(([name,values])=>[
   name,{samples:values.length,p50Ms:percentile(values,.5),p95Ms:percentile(values,.95)}
  ]));
  return {scope:"anonymous-aggregate",tokenEstimate:"output characters / 4; not actual API usage",costEstimate:"optional configured output token rate only; excludes input tokens and cache",providers,services,queue:{current:this.activeRequests,peak:this.peakRequests}};
 }
}
