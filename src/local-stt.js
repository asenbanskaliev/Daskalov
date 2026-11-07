/**
 * Ephemeral microphone recording for local Whisper. Raw recorded bytes are sent
 * only to this application's same-origin /api/stt/local; never to Cloud.
 */
export class LocalWhisperRecorder{
 constructor({
  mediaDevices=globalThis.navigator?.mediaDevices,
  MediaRecorderCtor=globalThis.MediaRecorder,
  fetchImpl=fetch,
  maxDurationMs=12000,
  maxBytes=2*1024*1024
 }={}){
  this.mediaDevices=mediaDevices;this.Recorder=MediaRecorderCtor;this.fetchImpl=fetchImpl;
  this.maxDurationMs=maxDurationMs;this.maxBytes=maxBytes;
  this.stream=null;this.recorder=null;this.timer=null;this.cancelled=false;this.running=false;
 }
 get available(){return Boolean(this.mediaDevices?.getUserMedia&&this.Recorder);}
 async start(){
  if(!this.available)throw Error("Captura local no disponible.");
  if(this.running)throw Error("Ya hay una grabación activa.");
  this.running=true;this.cancelled=false;
  try{
   const stream=await this.mediaDevices.getUserMedia({audio:true,video:false});
   if(this.cancelled){for(const track of stream.getTracks())track.stop();throw Error("Grabación cancelada.");}
   this.stream=stream;
   const type=["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/webm","audio/ogg"].find(t=>this.Recorder.isTypeSupported?.(t))||"audio/webm";
   const chunks=[];
   this.recorder=new this.Recorder(stream,{mimeType:type});
   return await new Promise((resolve,reject)=>{
    this.recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
    this.recorder.onerror=()=>reject(Error("Grabación de voz no disponible."));
    this.recorder.onstop=async()=>{
     clearTimeout(this.timer);this.cleanup();
     if(this.cancelled){reject(Error("Grabación cancelada."));return;}
     try{
      const blob=new Blob(chunks,{type});
      if(blob.size<10||blob.size>this.maxBytes)throw Error("La muestra de voz es demasiado corta o grande.");
      const result=await this.fetchImpl("/api/stt/local",{method:"POST",headers:{"content-type":type.split(";")[0]},body:blob});
      if(!result.ok){
       let error={};try{error=await result.json();}catch{}
       throw Error(error.error||"No se pudo transcribir con Whisper local.");
      }
      const data=await result.json();
      if(typeof data.transcript!=="string"||!data.transcript.trim())throw Error("Whisper no reconoció palabras.");
      resolve(data.transcript);
     }catch(error){reject(error);}
    };
    this.recorder.start(250);
    this.timer=setTimeout(()=>this.finish(),this.maxDurationMs);
   });
  }catch(error){this.cleanup();throw error;}
 }
 finish(){
  if(this.recorder?.state==="recording")this.recorder.stop();
 }
 cancel(){
  this.cancelled=true;
  if(this.recorder?.state==="recording")this.recorder.stop();
  this.cleanup();
 }
 cleanup(){
  clearTimeout(this.timer);
  for(const track of this.stream?.getTracks?.()||[])track.stop();
  this.stream=null;this.running=false;
 }
}
