import {resolve,dirname} from "node:path";
import {pathToFileURL} from "node:url";
import {openMemory} from "../server/memory.mjs";
import {createEncryptedBackup,restoreEncryptedBackup,pruneEncryptedBackups} from "../server/secure-backup.mjs";
async function main(){
 const [action,filepath]=process.argv.slice(2);
 const keyBase64=process.env.DASKALOV_BACKUP_KEY;
 if(action==="backup"){
  if(!process.env.DASKALOV_DB_PATH||!filepath)throw Error("DASKALOV_DB_PATH y destino .enc son requeridos");
  const memory=openMemory(resolve(process.env.DASKALOV_DB_PATH));
  try{await createEncryptedBackup({memory,destination:resolve(filepath),keyBase64});}
  finally{memory.close();}
 }else if(action==="restore"){
  if(!process.env.DASKALOV_DB_PATH||!filepath)throw Error("Ruta origen .enc y DASKALOV_DB_PATH requerido.");
  await restoreEncryptedBackup({
   source:resolve(filepath),target:resolve(process.env.DASKALOV_DB_PATH),keyBase64,
   erasureLedgerPath:process.env.DASKALOV_ERASURE_LEDGER_PATH?resolve(process.env.DASKALOV_ERASURE_LEDGER_PATH):null,
   erasureSecret:process.env.DASKALOV_ERASURE_LEDGER_SECRET,
   strictPrivacyRestore:process.env.DASKALOV_STRICT_PRIVACY_RESTORE==="1"
  });
 }else if(action==="prune"){
  if(!filepath)throw Error("Directorio requerido.");
  await pruneEncryptedBackups({directory:resolve(filepath)});
 }else throw Error("Comando permitido: backup|restore|prune.");
 process.stdout.write("Backup seguro: operación completada (sin registrar datos).\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{process.stderr.write(e.message+"\n");process.exitCode=1;});
