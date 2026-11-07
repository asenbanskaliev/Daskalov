export async function* parseNDJSON(readable,{maxLineChars=64000,signal}={}){
 if(!readable||typeof readable.getReader!=="function")throw new Error("No hay flujo de datos NDJSON.");
 const reader=readable.getReader();
 const decoder=new TextDecoder();
 const abort=()=>{reader.cancel(signal?.reason).catch(()=>{});};
 signal?.addEventListener("abort",abort,{once:true});
 if(signal?.aborted)abort();
 let buffer="";
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   if(buffer.length>maxLineChars*2)throw new Error("NDJSON demasiado grande.");
   let index;
   while((index=buffer.indexOf("\n"))!==-1){
    const line=buffer.slice(0,index).trim();
    buffer=buffer.slice(index+1);
    if(line.length>maxLineChars)throw new Error("Línea NDJSON demasiado grande.");
    if(line)yield JSON.parse(line);
   }
  }
  buffer+=decoder.decode();
  if(buffer.trim()){
   if(buffer.length>maxLineChars)throw new Error("Última línea NDJSON demasiado grande.");
   yield JSON.parse(buffer.trim());
  }
 }finally{signal?.removeEventListener("abort",abort);reader.releaseLock();}
}

export class SentenceChunker {
 constructor({minChars=12,maxChars=160}={}){
  this.minChars=minChars;this.maxChars=maxChars;this.buffer="";
 }
 push(delta){
  this.buffer+=String(delta);
  const sentences=[];
  while(this.buffer.length){
   const match=/[.!?…](?:["»”])?(?=\s|$)/u.exec(this.buffer);
   if(match && match.index>=this.minChars){
    const end=match.index+match[0].length;
    const sentence=this.buffer.slice(0,end).trim();
    this.buffer=this.buffer.slice(end).trimStart();
    if(sentence)sentences.push(sentence);
    continue;
   }
   if(this.buffer.length>=this.maxChars){
    const cutoff=this.buffer.lastIndexOf(" ",this.maxChars);
    const end=cutoff>this.maxChars/2?cutoff:this.maxChars;
    const sentence=this.buffer.slice(0,end).trim();
    this.buffer=this.buffer.slice(end).trimStart();
    if(sentence)sentences.push(sentence);
    continue;
   }
   break;
  }
  return sentences;
 }
 flush(){
  const last=this.buffer.trim();
  this.buffer="";
  return last?[last]:[];
 }
}
