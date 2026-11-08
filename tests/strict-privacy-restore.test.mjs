import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {randomUUID,randomBytes} from "node:crypto";
import {mkdtempSync,rmSync,existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createEncryptedBackup} from "../server/secure-backup.mjs";
import {appendErasure} from "../server/erasure-ledger.mjs";
import {openMemory} from "../server/memory.mjs";
import {createApp} from "../server/main.mjs";

test("SAFE-007: memory-enabled CLI restore fails closed without erasure ledger, and replays erased users when configured",async t=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-restore-policy-"));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const snapshot=join(dir,"before.enc"),target=join(dir,"restored.sqlite"),ledger=join(dir,"deletions.jsonl");
 const key=randomBytes(32).toString("base64"),secret=randomBytes(32).toString("hex"),id=randomUUID(),other=randomUUID();
 const memory=openMemory(":memory:");
 try{
  memory.save(id,"user","Secret erased history");
  memory.save(other,"user","Valid remaining history");
  await createEncryptedBackup({memory,destination:snapshot,keyBase64:key});
 }finally{memory.close();}
 const shared={...process.env,DASKALOV_DB_PATH:target,DASKALOV_BACKUP_KEY:key,DASKALOV_ALLOW_MEMORY:"1",
  DASKALOV_STRICT_PRIVACY_RESTORE:"0",DASKALOV_ERASURE_LEDGER_PATH:"",DASKALOV_ERASURE_LEDGER_SECRET:""};
 const run=env=>spawnSync(process.execPath,["scripts/secure-backup-cli.mjs","restore",snapshot],{env,encoding:"utf8",timeout:15000});
 const blocked=run(shared);
 assert.notEqual(blocked.status,0);
 assert.equal(existsSync(target),false,"failed restore must not write any decrypted SQLite database");
 await appendErasure({path:ledger,secret,playerId:id});
 const allowed=run({...shared,DASKALOV_ERASURE_LEDGER_PATH:ledger,DASKALOV_ERASURE_LEDGER_SECRET:secret});
 assert.equal(allowed.status,0,"failed authorized restore: "+allowed.stderr);
 const restored=openMemory(target);
 try{
  assert.deepEqual(restored.list(id),[]);
  assert.equal(restored.list(other).length,1);
  assert.equal(restored.integrity().quickCheck,"ok");
 }finally{restored.close();}
});
test("SAFE-007: configured erasure ledger without 32-character key blocks server startup",()=>{
 assert.throws(()=>createApp({dbPath:":memory:",allowMemory:true,erasureLedgerPath:"/tmp/deletions.jsonl",erasureLedgerSecret:"bad"}),/clave de registro/);
});
