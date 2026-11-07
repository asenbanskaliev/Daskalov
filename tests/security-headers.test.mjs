import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
test("SAFE-004: CSP, Permissions-Policy y anti-clickjacking en HTML y JSON",async t=>{
 const app=createApp({dbPath:":memory:"});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 for(const path of ["/api/health","/","/missing"]){
  const r=await fetch(base+path);
  assert.match(r.headers.get("content-security-policy")||"",/script-src 'self'/);
  assert.match(r.headers.get("content-security-policy")||"",/frame-ancestors 'none'/);
  assert.doesNotMatch(r.headers.get("content-security-policy")||"",/unsafe-inline|unsafe-eval/);
  assert.equal(r.headers.get("x-frame-options"),"DENY");
  assert.equal(r.headers.get("x-content-type-options"),"nosniff");
  assert.equal(r.headers.get("referrer-policy"),"no-referrer");
  assert.match(r.headers.get("permissions-policy")||"",/microphone=\(self\)/);
  assert.equal(r.headers.get("access-control-allow-origin"),null);
 }
});
