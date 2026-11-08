import {DatabaseSync} from "node:sqlite";
import {createHmac,randomUUID} from "node:crypto";
import {mkdirSync} from "node:fs";
import {dirname} from "node:path";
/**
 * Atomic SQLite quotas across multiple Node processes sharing one DB volume.
 * Identity and global scope are salted/HMACed; no plaintext IP/user ID is stored.
 * Strict deployment gate: never use :memory: or an ephemeral signing secret.
 */
export class AtomicUsageLedger{
 constructor({path,secret,leaseMs=90000}={}){
  if(typeof path!=="string"||!path||path===":memory:")throw Error("El límite compartido requiere SQLite persistente.");
  if(typeof secret!=="string"||secret.length<24)throw Error("DASKALOV_LEDGER_SECRET insuficiente.");
  this.secret=secret;
  this.leaseMs=Math.max(1000,Math.min(120000,Number(leaseMs)||90000));
  mkdirSync(dirname(path),{recursive:true});
  this.db=new DatabaseSync(path);
  this.db.exec([
   "PRAGMA journal_mode=WAL;","PRAGMA busy_timeout=5000;",
   "CREATE TABLE IF NOT EXISTS usage_daily(subject TEXT NOT NULL, provider TEXT NOT NULL, day TEXT NOT NULL, requests INTEGER NOT NULL, tokens INTEGER NOT NULL, PRIMARY KEY(subject,provider,day));",
   "CREATE TABLE IF NOT EXISTS usage_leases(id TEXT PRIMARY KEY, subject TEXT NOT NULL, provider TEXT NOT NULL, expires_ms INTEGER NOT NULL);",
   "CREATE INDEX IF NOT EXISTS usage_lease_subject ON usage_leases(subject,expires_ms);"
  ].join("\n"));
  this.read=this.db.prepare("SELECT requests,tokens FROM usage_daily WHERE subject=? AND provider=? AND day=?");
  this.upsert=this.db.prepare("INSERT INTO usage_daily(subject,provider,day,requests,tokens) VALUES(?,?,?,1,?) ON CONFLICT(subject,provider,day) DO UPDATE SET requests=requests+1,tokens=tokens+excluded.tokens");
  this.active=this.db.prepare("SELECT COUNT(*) AS n FROM usage_leases WHERE subject=?");
  this.insert=this.db.prepare("INSERT INTO usage_leases(id,subject,provider,expires_ms) VALUES(?,?,?,?)");
  this.releaseStmt=this.db.prepare("DELETE FROM usage_leases WHERE id=?");
  this.expire=this.db.prepare("DELETE FROM usage_leases WHERE expires_ms<=?");
  this.old=this.db.prepare("DELETE FROM usage_daily WHERE day<?");
 }
 key(input){return createHmac("sha256",this.secret).update(String(input),"utf8").digest("hex");}
 reserve({identity,provider,nowMs=Date.now(),estimatedTokens=2100,requestsPerDay=60,tokensPerDay=140000,concurrent=1,globalCloudCallsPerDay=24}={}){
  if(typeof identity!=="string"||!identity||identity.length>128)throw Error("Identidad de cuota inválida.");
  if(!["local","cloud","openrouter","nvidia"].includes(provider))throw Error("Proveedor de cuota inválido.");
  if(!Number.isFinite(nowMs)||nowMs<0)throw Error("Reloj de cuota inválido.");
  const tokens=Math.max(1,Math.min(200000,Math.ceil(Number(estimatedTokens)||2100)));
  const day=new Date(nowMs).toISOString().slice(0,10);
  const previous=new Date(nowMs-8*86400000).toISOString().slice(0,10);
  const subject=this.key("identity:"+identity),global=this.key("global-cloud-budget");
  this.db.exec("BEGIN IMMEDIATE");
  try{
   this.expire.run(Math.trunc(nowMs));this.old.run(previous);
   const used=this.read.get(subject,provider,day)||{requests:0,tokens:0};
   const busy=this.active.get(subject).n;
   const globalUsed=provider!=="local"?this.read.get(global,"cloud",day)||{requests:0}:null;
   const denied=used.requests>=requestsPerDay||used.tokens+tokens>tokensPerDay||
    busy>=concurrent||(provider!=="local"&&globalUsed.requests>=globalCloudCallsPerDay);
   if(denied){this.db.exec("ROLLBACK");return {accepted:false,reason:"quota"};}
   const leaseId=randomUUID();
   this.upsert.run(subject,provider,day,tokens);
   if(provider!=="local")this.upsert.run(global,"cloud",day,tokens);
   this.insert.run(leaseId,subject,provider,Math.trunc(nowMs+this.leaseMs));
   this.db.exec("COMMIT");
   return {accepted:true,leaseId};
  }catch(error){this.db.exec("ROLLBACK");throw error;}
 }
 release(leaseId){if(typeof leaseId==="string")this.releaseStmt.run(leaseId);}
 close(){this.db.close();}
}
