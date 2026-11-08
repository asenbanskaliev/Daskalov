import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {readFile,writeFile,mkdtemp,rm,unlink,readdir,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,dirname,basename} from "node:path";
import {DatabaseSync} from "node:sqlite";
const MAGIC=Buffer.from("DASKALOV-BACKUP-V1\n","ascii");
function parseKey(value){
 if(typeof value!=="string"||!/^[A-Za-z0-9+/]{43}=$/.test(value))throw Error("Se necesita una clave AES-256 en base64.");
 const key=Buffer.from(value,"base64");
 if(key.length!==32)throw Error("Longitud incorrecta de clave de respaldo.");
 return key;
}
export async function createEncryptedBackup({memory,destination,keyBase64}){
 if(!memory||typeof memory.backup!=="function")throw Error("Almacén SQLite necesario.");
 if(typeof destination!=="string"||!destination.endsWith(".enc"))throw Error("Destino cifrado .enc requerido.");
 const key=parseKey(keyBase64);
 const tmp=await mkdtemp(join(tmpdir(),"daskalov-snapshot-"));
 try{
  const plain=join(tmp,"snapshot.sqlite");
  memory.backup(plain);
  const data=await readFile(plain);
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,iv);
  const encrypted=Buffer.concat([cipher.update(data),cipher.final()]);
  const tag=cipher.getAuthTag();
  const record=Buffer.concat([MAGIC,iv,tag,encrypted]);
  await writeFile(destination,record,{mode:0o600,flag:"wx"});
  return {encrypted:true,bytes:record.length};
 }finally{
  await rm(tmp,{recursive:true,force:true});
 }
}
export async function restoreEncryptedBackup({source,target,keyBase64}){
 if(typeof target!=="string"||!target.endsWith(".sqlite"))throw Error("Destino SQLite requerido.");
 const key=parseKey(keyBase64);
 const blob=await readFile(source);
 if(blob.length<MAGIC.length+12+16||!blob.subarray(0,MAGIC.length).equals(MAGIC))throw Error("Formato de backup inválido.");
 const start=MAGIC.length,iv=blob.subarray(start,start+12),tag=blob.subarray(start+12,start+28);
 const decipher=createDecipheriv("aes-256-gcm",key,iv);
 decipher.setAuthTag(tag);
 const plain=Buffer.concat([decipher.update(blob.subarray(start+28)),decipher.final()]);
 try{
  await writeFile(target,plain,{mode:0o600,flag:"wx"});
  const db=new DatabaseSync(target,{readOnly:true});
  try{
   const check=db.prepare("PRAGMA quick_check").get().quick_check;
   if(check!=="ok")throw Error("Backup SQLite no supera comprobación de integridad.");
  }finally{db.close();}
  return {restored:true,bytes:plain.length};
 }catch(error){
  // Never erase a previously existing target on EEXIST or other pre-write errors.
  if(error.code!=="EEXIST")await unlink(target).catch(()=>{});
  throw error;
 }
}
export async function pruneEncryptedBackups({directory,now=Date.now(),maxAgeDays=30}){
 if(!Number.isFinite(maxAgeDays)||maxAgeDays<=0||maxAgeDays>365)throw Error("Retención fuera de rango.");
 const files=await readdir(directory),deleted=[];
 for(const file of files){
  if(!/^daskalov-[A-Za-z0-9_-]+\.enc$/.test(file))continue;
  const path=join(directory,file);
  const st=await stat(path);
  if(!st.isFile()||now-st.mtimeMs<=maxAgeDays*86400000)continue;
  await unlink(path);
  deleted.push(file);
 }
 return {deleted:deleted.length};
}
