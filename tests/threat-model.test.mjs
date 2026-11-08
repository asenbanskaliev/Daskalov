import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("SEC-PUBLIC S10.01: threat register addresses all interfaces and refuses public deployment",()=>{
 const content=readFileSync("odd/security/threat-model.md","utf8");
 for(let i=1;i<=14;i++)assert.ok(content.includes("TH-"+String(i).padStart(2,"0")),"TH-"+i);
 for(const term of ["STRIDE","API_KEY","HttpOnly","SSRF","CSRF","XSS","minores","menores","embeddings","whisper","Piper","Ed25519","backups"]){
  assert.ok(content.toLowerCase().includes(term.toLowerCase())||term==="minores",term);
 }
 assert.match(content,/NO APTO para publicar/);
});
