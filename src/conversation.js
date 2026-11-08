import {providerHeaders} from "./provider-credentials.js";
import {validateTurnEvent} from "../shared/turn-protocol.js";
// Shared server/browser schema validation handles the allowed event catalogue.

export class TurnProtocolError extends Error {
 constructor(message){super(message);this.name="TurnProtocolError";}
}

export async function* streamTurn({body,signal,fetchImpl=fetch,endpoint="/api/chat/stream",csrfToken=null}){
 const headers={"content-type":"application/json",...providerHeaders(body?.provider)};
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
  try{validateTurnEvent(event,{previousSequence,requestId:currentRequestId});}
  catch{throw new TurnProtocolError("Evento de conversación inválido o fuera de orden.");}
  previousSequence=event.sequence;
  if(currentRequestId===null)currentRequestId=event.requestId;
  if(["completed","error","cancelled"].includes(event.type))completed=true;
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
