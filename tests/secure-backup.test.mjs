import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openMemory} from "../server/memory.mjs";
import {createEncryptedBackup,restoreEncryptedBackup,pruneEncryptedBackups} from "../server/secure-backup.mjs";
test("MEM-010/SAFE-007: encrypted SQLite backup excludes plaintext and restores verified FTS5",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-enc-")),path=join(dir,"daskalov-test.enc"),target=join(dir,"restored.sqlite");
 const key=randomBytes(32).toString("base64"),id=randomUUID(),db=openMemory(":memory:");
 try{
  db.save(id,"user","Las matemáticas me encantan muchísimo");
  const report=await createEncryptedBackup({memory:db,destination:path,keyBase64:key});
  assert.equal(report.encrypted,true);
  assert.ok(!readFileSync(path).includes(Buffer.from("matemáticas")));
  await assert.rejects(()=>restoreEncryptedBackup({source:path,target,keyBase64:randomBytes(32).toString("base64")}));
  const restored=await restoreEncryptedBackup({source:path,target,keyBase64:key});
  assert.equal(restored.restored,true);
  const check=openMemory(target);
  try{
   assert.equal(check.integrity().quickCheck,"ok");
   assert.ok(check.search(id,"matemáticas").length>0);
  }finally{check.close();}
  await assert.rejects(()=>restoreEncryptedBackup({source:path,target,keyBase64:key}),{code:"EEXIST"});
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
test("SAFE-007: backup pruning removes only expired encrypted files with strict names",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-backup-prune-"));
 try{
  const {writeFileSync,utimesSync,existsSync}=await import("node:fs");
  const old=join(dir,"daskalov-old.enc"),keep=join(dir,"keep.sqlite");
  writeFileSync(old,"encrypted");writeFileSync(keep,"private");
  utimesSync(old,new Date(0),new Date(0));
  const result=await pruneEncryptedBackups({directory:dir,now:Date.now(),maxAgeDays:2});
  assert.equal(result.deleted,1);assert.equal(existsSync(keep),true);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
