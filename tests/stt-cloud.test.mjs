import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {transcribeCloudStt} from "../server/stt-cloud.mjs";
import {createApp} from "../server/main.mjs";
test("STT-005: fixed cloud vendor URL and Spanish model; key stays in server",async()=>{
 let captured;
 const env={DASKALOV_ENABLE_STT_CLOUD:"1",DASKALOV_STT_CLOUD_KEY:"fake-key"};
 const text=await transcribeCloudStt({audio:Buffer.alloc(100),env,fetchImpl:async(url,opts)=>{
  captured={url,opts};return Response.json({text:" Buenos días profesor "});
 }});
 assert.equal(text,"Buenos días profesor");
 assert.equal(captured.url,"https://api.openai.com/v1/audio/transcriptions");
 assert.equal(captured.opts.body.get("model"),"gpt-4o-mini-transcribe");
 assert.equal(captured.opts.body.get("language"),"es");
 await assert.rejects(()=>transcribeCloudStt({audio:Buffer.alloc(100),env:{}}),e=>e.status===503);
 await assert.rejects(()=>transcribeCloudStt({audio:Buffer.alloc(3),env}),e=>e.status===413);
 await assert.rejects(()=>transcribeCloudStt({audio:Buffer.alloc(100),mime:"audio/mp3",env}),e=>e.status===415);
});
test("STT-005: cloud requires explicit header, stays private and respects daily budget",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",allowCloudStt:true,sttCloudTranscriber:async()=>{calls++;return "Hola";}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const url="http://127.0.0.1:"+app.server.address().port+"/api/stt/cloud";
 const send=consent=>fetch(url,{method:"POST",headers:{"content-type":"audio/webm",...(consent?{"x-daskalov-audio-consent":"cloud"}:{})},body:Buffer.alloc(200)});
 assert.equal((await send(false)).status,403);
 for(let i=0;i<6;i++)assert.equal((await send(true)).status,200);
 assert.equal((await send(true)).status,429);
 assert.equal(calls,6);
});
test("STT-005: default cloud disabled, no vendor call",async t=>{
 const app=createApp({dbPath:":memory:",allowCloudStt:false,sttCloudTranscriber:async()=>{throw Error("external call");}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const r=await fetch("http://127.0.0.1:"+app.server.address().port+"/api/stt/cloud",{method:"POST",headers:{"content-type":"audio/webm","x-daskalov-audio-consent":"cloud"},body:Buffer.alloc(20)});
 assert.equal(r.status,403);
});
