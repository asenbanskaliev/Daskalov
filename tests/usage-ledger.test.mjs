import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {AtomicUsageLedger} from "../server/usage-ledger.mjs";
test("SAFE-005: multiple server processes share atomic call, token and concurrency quotas",()=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-quota-")),path=join(dir,"quota.sqlite"),secret="a".repeat(32);
 const a=new AtomicUsageLedger({path,secret,leaseMs:1000});
 const b=new AtomicUsageLedger({path,secret,leaseMs:1000});
 const identity="192.0.2.10",nowMs=Date.parse("2026-11-08T09:00:00.000Z");
 try{
  const options={identity,provider:"cloud",nowMs,concurrent:1,globalCloudCallsPerDay:2,requestsPerDay:5,tokensPerDay:100,estimatedTokens:30};
  const first=a.reserve(options);
  assert.equal(first.accepted,true);
  assert.equal(b.reserve(options).accepted,false,"Concurrent limit across processes");
  a.release(first.leaseId);
  const second=b.reserve(options);
  assert.equal(second.accepted,true);
  b.release(second.leaseId);
  assert.equal(a.reserve({...options,identity:"different"}).accepted,false,"Global cloud quota across players");
  const db=new DatabaseSync(path,{readOnly:true});
  try{
   const values=JSON.stringify(db.prepare("SELECT * FROM usage_daily").all());
   assert.ok(!values.includes(identity),"Never store plaintext IP");
  }finally{db.close();}
  assert.equal(a.reserve({...options,nowMs:nowMs+86400000}).accepted,true,"New day resets daily requests");
 }finally{a.close();b.close();rmSync(dir,{recursive:true,force:true});}
});
test("SAFE-005: abandoned leases expire, token budget refuses overflow and secrets are mandatory",()=>{
 const dir=mkdtempSync(join(tmpdir(),"daskalov-quota-")),path=join(dir,"quota.sqlite");
 try{
  assert.throws(()=>new AtomicUsageLedger({path,secret:"short"}),/SECRET/);
  assert.throws(()=>new AtomicUsageLedger({path:":memory:",secret:"x".repeat(32)}),/persistente/);
  const l=new AtomicUsageLedger({path,secret:"x".repeat(32),leaseMs:1000});
  const data={identity:"kid",provider:"local",nowMs:100000,concurrent:1,estimatedTokens:20,requestsPerDay:10,tokensPerDay:40};
  assert.equal(l.reserve(data).accepted,true);
  assert.equal(l.reserve(data).accepted,false);
  assert.equal(l.reserve({...data,nowMs:101001,estimatedTokens:21}).accepted,false,"Daily token budget");
  assert.equal(l.reserve({...data,nowMs:101001,estimatedTokens:20}).accepted,true,"TTL releases concurrency");
  l.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
