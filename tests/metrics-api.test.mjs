import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";

test("LLM-010: API privada entrega telemetría agregada sin contenidos ni identificadores",async t=>{
 const app=createApp({dbPath:":memory:",streamLlm:async function*(){yield "Un secreto de clase NO debe quedar en métricas.";},maxCloudCallsPerDay:10});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(r=>app.server.close(r));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const r=await fetch(base+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"El alumno dijo un secreto"})});
 assert.equal(r.status,200);await r.text();
 const metricRes=await fetch(base+"/api/metrics");
 assert.equal(metricRes.status,200);
 const data=await metricRes.json();
 assert.equal(data.providers.local.successes,1);
 assert.ok(data.providers.local.durationP95Ms!==null);
 const json=JSON.stringify(data);
 assert.ok(!json.includes("Un secreto de clase"));
 assert.ok(!json.includes("El alumno dijo"));
 assert.ok(!json.includes("127.0.0.1"));
});
test("LLM-010: bloquea telemetría cuando Host no es local",async t=>{
 const app=createApp({dbPath:":memory:"});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(r=>app.server.close(r));app.close();});
 const {request}=await import("node:http");
 const url="http://127.0.0.1:"+app.server.address().port+"/api/metrics";
 const code=await new Promise((resolve,reject)=>{
  const req=request(url,{headers:{Host:"externo.example"}},r=>{r.resume();r.on("end",()=>resolve(r.statusCode));});
  req.on("error",reject);req.end();
 });
 assert.equal(code,403);
});
