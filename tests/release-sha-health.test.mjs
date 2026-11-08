import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
test("REL-005: health reports configured immutable release SHA without secrets",async t=>{
 const sha="a".repeat(40);
 const app=createApp({dbPath:":memory:",releaseSha:sha});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const r=await fetch("http://127.0.0.1:"+app.server.address().port+"/api/health");
 assert.equal(r.status,200);
 const data=await r.json();
 assert.equal(data.releaseSha,sha);
 assert.equal(typeof data.ok,"boolean");
 assert.equal(Object.hasOwn(data,"apiKey"),false);
 assert.throws(()=>createApp({dbPath:":memory:",releaseSha:"bad"}),/SHA de despliegue/);
});
