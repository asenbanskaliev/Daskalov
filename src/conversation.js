const VALID_TYPES=new Set(["started","delta","sentence","completed","error"]);

export class TurnProtocolError extends Error {
 constructor(message){super(message);this.name="TurnProtocolError";}
}

export async function* streamTurn({body,signal,fetchImpl=fetch,endpoint="/api/chat/stream",csrfToken=null}){
 const headers={"content-type":"application/json"};
 if(csrfToken)headers["x-daskalov-csrf"]=csrfToken;
 const response=await fetchImpl(endpoint,{
  method:"POST",
  headers,
  body:JSON.stringify(body),
  signal
 });
 if(!response.ok){
  let result={};
  try{result=await response.json();}catch{}
  throw new Error(result.error||"Error de conexión: HTTP "+response.status);
 }
 if(!response.body)throw new TurnProtocolError("No hay respuesta de streaming.");
 const reader=response.body.getReader(),decoder=new TextDecoder();
 let buffer="",previousSequence=-1,currentRequestId=null,completed=false;
 function validate(event){
  if(!event||!VALID_TYPES.has(event.type)||typeof event.requestId!=="string"||!Number.isInteger(event.sequence)){
   throw new TurnProtocolError("Evento de conversación inválido.");
  }
  if(event.sequence!==previousSequence+1)throw new TurnProtocolError("Eventos fuera de orden.");
  if(currentRequestId===null)currentRequestId=event.requestId;
  if(currentRequestId!==event.requestId)throw new TurnProtocolError("Respuesta de otro turno.");
  if(["delta","sentence"].includes(event.type)&&typeof event.text!=="string")throw new TurnProtocolError("Texto del fragmento inválido.");
  if(event.type==="completed"&&typeof event.reply!=="string")throw new TurnProtocolError("Respuesta final inválida.");
  previousSequence=event.sequence;
  if(event.type==="completed"||event.type==="error")completed=true;
  return event;
 }
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   if(buffer.length>65536)throw new TurnProtocolError("Mensaje de flujo demasiado grande.");
   let at;
   while((at=buffer.indexOf("\n"))!==-1){
    const line=buffer.slice(0,at).trim();
    buffer=buffer.slice(at+1);
    if(line){
     const event=validate(JSON.parse(line));
     yield event;
     if(completed)return;
    }
   }
  }
  buffer+=decoder.decode();
  if(buffer.trim()){
   const event=validate(JSON.parse(buffer.trim()));
   yield event;
  }
  if(!completed&&!signal?.aborted)throw new TurnProtocolError("La conversación terminó sin respuesta final.");
 }finally{reader.releaseLock();}
}
