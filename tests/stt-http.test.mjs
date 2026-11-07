import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
test("STT-004: proxy same origin envía audio a transcriptor mock y NO guarda datos",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",sttTranscriber:async({audio,mime})=>{
  calls++;assert.equal(audio.length,128);assert.equal(mime,"audio/webm");return "Profesor, estoy en clase";
 }});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));app.close();});
 const url="http://127.0.0.1:"+app.server.address().port+"/api/stt/local";
 let response=await fetch(url,{method:"POST",headers:{"content-type":"audio/webm"},body:Buffer.alloc(128)});
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{transcript:"Profesor, estoy en clase"});
 assert.equal(calls,1);
 response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
 assert.equal(response.status,415);assert.equal(calls,1);
});
