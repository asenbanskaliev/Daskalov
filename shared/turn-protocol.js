/**
 * @typedef {"started"|"delta"|"sentence"|"gesture"|"completed"|"cancelled"|"error"} TurnEventType
 * @typedef {"talk"|"ruler_desk"|"point_board"|"surprised"} AllowedGesture
 * @typedef {{schemaVersion:1,type:TurnEventType,requestId:string,sequence:number,text?:string,reply?:string,animation?:AllowedGesture,error?:string,provider?:string,model?:string}} TurnEvent
 * Shared wire contract for Node and the browser. Never execute generated LLM content.
 */
export const TURN_SCHEMA_VERSION = 1;
export const TURN_EVENT_TYPES = Object.freeze(["started","delta","sentence","gesture","completed","cancelled","error"]);
export const ALLOWED_GESTURES = Object.freeze(["talk","ruler_desk","point_board","surprised"]);
const TYPES=new Set(TURN_EVENT_TYPES);
const GESTURES=new Set(ALLOWED_GESTURES);
export function validateTurnEvent(event,{previousSequence=-1,requestId=null}={}){
 if(!event||typeof event!=="object"||!TYPES.has(event.type))throw Error("Tipo de evento no admitido.");
 if(event.schemaVersion!==undefined&&event.schemaVersion!==TURN_SCHEMA_VERSION)throw Error("Versión de protocolo no admitida.");
 if(typeof event.requestId!=="string"||!event.requestId||event.requestId.length>100||!Number.isInteger(event.sequence)||event.sequence!==previousSequence+1)throw Error("Identificador o secuencia inválidos.");
 if(requestId!==null&&requestId!==event.requestId)throw Error("Fragmento de otra conversación.");
 if(["delta","sentence"].includes(event.type)&&(typeof event.text!=="string"||event.text.length>6000))throw Error("Texto de fragmento inválido.");
 if(event.type==="completed"&&(typeof event.reply!=="string"||event.reply.length>6000))throw Error("Respuesta final inválida.");
 if(event.type==="gesture"&&!GESTURES.has(event.animation))throw Error("Gesto no autorizado.");
 if(event.type==="error"&&(typeof event.error!=="string"||event.error.length>300))throw Error("Evento de error inválido.");
 return event;
}
export function makeTurnEvent({type,requestId,sequence,...data}){
 const event={schemaVersion:TURN_SCHEMA_VERSION,type,requestId,sequence,...data};
 validateTurnEvent(event,{previousSequence:sequence-1,requestId});
 return event;
}
