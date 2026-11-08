import {createHmac} from "node:crypto";
import {open,readFile} from "node:fs/promises";
/**
 * HMAC-only erasure tombstones live OUTSIDE SQLite backups. Keep the key and
 * ledger safe for at least as long as ANY historic encrypted snapshot exists.
 */
function checkSecret(secret){
 if(typeof secret!=="string"||secret.length<32)throw Error("Secreto de supresión no configurado.");
}
function checkId(playerId){
 if(typeof playerId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId))throw Error("Identificador privado inválido.");
}
function mac(secret,data){return createHmac("sha256",secret).update(data).digest("hex");}
export function erasureDigest(playerId,secret){
 checkSecret(secret);checkId(playerId);
 return mac(secret,"daskalov-erased-player-v1:"+playerId.toLowerCase());
}
export async function appendErasure({path,secret,playerId}){
 if(typeof path!=="string"||!path.trim())throw Error("Ruta de supresión obligatoria.");
 const hash=erasureDigest(playerId,secret);
 const record={v:1,hash,mac:mac(secret,"daskalov-erasure-record-v1:"+hash)};
 const file=await open(path,"a",0o600);
 try{await file.write(JSON.stringify(record)+"\n");await file.sync();}
 finally{await file.close();}
 return {recorded:true};
}
export async function readErasureHashes({path,secret}){
 checkSecret(secret);
 if(typeof path!=="string"||!path.trim())throw Error("Ruta de supresión obligatoria.");
 const data=await readFile(path,"utf8");
 if(data.length>5*1024*1024)throw Error("Registro de supresiones excesivo.");
 const hashes=new Set();
 for(const line of data.split("\n").filter(Boolean)){
  let row;try{row=JSON.parse(line);}catch{throw Error("Registro de supresiones corrupto.");}
  if(row.v!==1||typeof row.hash!=="string"||!/^[a-f0-9]{64}$/.test(row.hash)||row.mac!==mac(secret,"daskalov-erasure-record-v1:"+row.hash)){
   throw Error("Firma del registro de supresiones inválida.");
  }
  hashes.add(row.hash);
 }
 return hashes;
}
