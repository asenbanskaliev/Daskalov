import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
import {open,readFile,writeFile,rename,unlink} from "node:fs/promises";
import {setTimeout as sleep} from "node:timers/promises";

/** HMAC-only deletion ledger, with a separately authenticated full-file anchor. */
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
function anchorFor(data,secret){
 return {v:2,count:data.split("\n").filter(Boolean).length,
  digest:mac(secret,"daskalov-ledger-anchor-v2\n"+data)};
}
async function publishAnchor(path,data,secret){
 const temp=path+".head."+randomUUID();
 try{
  await writeFile(temp,JSON.stringify(anchorFor(data,secret))+"\n",{mode:0o600,flag:"wx"});
  await rename(temp,path+".head");
 }finally{await unlink(temp).catch(()=>{});}
}
async function withLock(path,fn){
 const lockPath=path+".lock";
 let lock;
 for(let attempt=0;attempt<40;attempt++){
  try{lock=await open(lockPath,"wx",0o600);break;}
  catch(err){if(err.code!=="EEXIST")throw err;await sleep(25);}
 }
 if(!lock)throw Error("Registro de supresiones ocupado: se deniega borrado.");
 try{return await fn();}
 finally{await lock.close();await unlink(lockPath).catch(()=>{});}
}
/** Initialize an empty, anchored ledger before first private backup restoration. */
export async function initializeErasureLedger({path,secret}){
 checkSecret(secret);
 if(typeof path!=="string"||!path.trim())throw Error("Ruta de supresión obligatoria.");
 return withLock(path,async()=>{
  const file=await open(path,"wx",0o600);
  try{await file.sync();}finally{await file.close();}
  await publishAnchor(path,"",secret);
  return {initialized:true};
 });
}
export async function appendErasure({path,secret,playerId}){
 if(typeof path!=="string"||!path.trim())throw Error("Ruta de supresión obligatoria.");
 const hash=erasureDigest(playerId,secret);
 return withLock(path,async()=>{
  let previous="";
  try{
   previous=await readFile(path,"utf8");
   await readErasureHashes({path,secret});
  }catch(err){if(err.code!=="ENOENT")throw err;
   // Missing both files is a new ledger; missing only its anchor is fatal.
   try{await readFile(path,"utf8");throw Error("Firma del registro de supresiones ausente.");}
   catch(inner){if(inner.code!=="ENOENT")throw inner;}
  }
  const row={v:1,hash,mac:mac(secret,"daskalov-erasure-record-v1:"+hash)};
  const serialized=JSON.stringify(row)+"\n";
  const file=await open(path,"a",0o600);
  try{await file.write(serialized);await file.sync();}
  finally{await file.close();}
  // Failure/crash between append and anchoring is intentionally fail-closed.
  await publishAnchor(path,previous+serialized,secret);
  return {recorded:true};
 });
}
export async function readErasureHashes({path,secret}){
 checkSecret(secret);
 if(typeof path!=="string"||!path.trim())throw Error("Ruta de supresión obligatoria.");
 const [data,anchorText]=await Promise.all([readFile(path,"utf8"),readFile(path+".head","utf8")]);
 if(data.length>5*1024*1024)throw Error("Registro de supresiones excesivo.");
 let anchor;try{anchor=JSON.parse(anchorText);}catch{throw Error("Firma del registro de supresiones corrupta.");}
 const expected=anchorFor(data,secret);
 if(anchor?.v!==2||anchor.count!==expected.count||typeof anchor.digest!=="string"||!/^[a-f0-9]{64}$/.test(anchor.digest)||
    !timingSafeEqual(Buffer.from(anchor.digest,"hex"),Buffer.from(expected.digest,"hex")))
  throw Error("Firma del registro de supresiones íntegro inválida: posible truncamiento.");
 const hashes=new Set();
 for(const line of data.split("\n").filter(Boolean)){
  let row;try{row=JSON.parse(line);}catch{throw Error("Registro de supresiones corrupto.");}
  if(row.v!==1||typeof row.hash!=="string"||!/^[a-f0-9]{64}$/.test(row.hash)||row.mac!==mac(secret,"daskalov-erasure-record-v1:"+row.hash))
   throw Error("Firma del registro de supresiones inválida.");
  hashes.add(row.hash);
 }
 return hashes;
}
