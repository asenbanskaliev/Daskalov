import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import {mkdtempSync,readFileSync,rmSync,appendFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openMemory} from "../server/memory.mjs";
import {appendErasure,readErasureHashes} from "../server/erasure-ledger.mjs";
import {createEncryptedBackup,restoreEncryptedBackup} from "../server/secure-backup.mjs";

test("MEM-007/SAFE-007: erasure HMAC tombstone prevents deleted player reappearing after encrypted restore",async t=>{
 const folder=mkdtempSync(join(tmpdir(),"daskalov-erased-"));
 t.after(()=>rmSync(folder,{recursive:true,force:true}));
 const ledger=join(folder,"erasure.jsonl"),before=join(folder,"backup.enc"),after=join(folder,"restored.sqlite");
 const id=randomUUID(),other=randomUUID(),secret=randomBytes(32).toString("hex"),key=randomBytes(32).toString("base64");
 const memory=openMemory(":memory:");
 memory.save(id,"user","Recuerdo que mi curso tiene tizas");memory.recordProgress(id,"math",10);
 memory.save(other,"user","Prefiero leer historia");memory.recordProgress(other,"history",10);
 await createEncryptedBackup({memory,destination:before,keyBase64:key});
 await appendErasure({path:ledger,secret,playerId:id});
 memory.deletePlayer(id);
 assert.deepEqual(memory.list(id),[]);memory.close();
 const raw=readFileSync(ledger,"utf8");
 assert.ok(!raw.includes(id));assert.ok(!raw.includes("tizas"));
 assert.equal((await readErasureHashes({path:ledger,secret})).size,1);
 await restoreEncryptedBackup({source:before,target:after,keyBase64:key,erasureLedgerPath:ledger,erasureSecret:secret,strictPrivacyRestore:true});
 const restored=openMemory(after);
 try{
  assert.equal(restored.list(id).length,0);
  assert.equal(restored.getProgress(id).length,0);
  assert.ok(restored.search(other,"historia").length>0);
  assert.equal(restored.getProgress(other)[0].lesson_id,"history");
  assert.equal(restored.integrity().quickCheck,"ok");
 }finally{restored.close();}
});
test("SAFE-007: missing or altered privacy tombstones fail restoration before writing DB",async t=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-erasure-fail-"));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const ledger=join(dir,"deleted.jsonl"),target=join(dir,"out.sqlite"),secret=randomBytes(32).toString("hex");
 await appendErasure({path:ledger,secret,playerId:randomUUID()});
 assert.ok((await readErasureHashes({path:ledger,secret})).size===1);
 appendFileSync(ledger,'{"v":1,"hash":"oops","mac":"fake"}\n');
 await assert.rejects(()=>readErasureHashes({path:ledger,secret}),/Firma/);
 await assert.rejects(()=>restoreEncryptedBackup({source:"none.enc",target,keyBase64:randomBytes(32).toString("base64"),erasureLedgerPath:ledger,erasureSecret:secret,strictPrivacyRestore:true}),/Firma/);
 await assert.rejects(()=>restoreEncryptedBackup({source:"none.enc",target,keyBase64:randomBytes(32).toString("base64"),strictPrivacyRestore:true}),/registro/);
});
