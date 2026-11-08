import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
import {encodePCM16MonoWav,validateWaveHeader} from "../server/audio-wav.mjs";
import {moderateProfessorOutput} from "../server/output-moderation.mjs";

test("VAL-01+02: actual HTTP stream sentence passes into 16kHz WAV endpoint with no persistent memory",async t=>{
 const requests=[];
 const app=createApp({
  dbPath:":memory:",allowMemory:false,
  streamLlm:async function*(){yield "Buenos días, ";yield "vamos a estudiar historia."},
  ttsSynth:async({text})=>{
   requests.push(text);
   return encodePCM16MonoWav(new Float32Array(3200),16000);
  }
 });
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const stream=await fetch(base+"/api/chat/stream",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"¿Qué es la historia?",remember:false})
 });
 assert.equal(stream.status,200);
 const rows=(await stream.text()).trim().split("\n").map(JSON.parse);
 assert.equal(rows.at(-1).type,"completed");
 assert.match(rows.at(-1).reply,/vamos a estudiar historia/);
 const utterances=rows.filter(x=>x.type==="sentence").map(x=>x.text);
 assert.ok(utterances.length>0);
 for(const text of utterances){
  const response=await fetch(base+"/api/tts/local",{
   method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({text})
  });
  assert.equal(response.status,200);
  assert.match(response.headers.get("content-type"),/audio\/wav/);
  assert.equal(response.headers.get("cache-control"),"no-store");
  const header=validateWaveHeader(Buffer.from(await response.arrayBuffer()));
  assert.equal(header.sampleRate,16000);
  assert.equal(header.channels,1);
  assert.equal(header.durationSec,.2);
 }
 assert.deepEqual(requests,utterances);
 assert.equal((await (await fetch(base+"/api/session")).json()).memoryAvailable,false);
});

test("VAL-05: unsafe response split across chunks is withheld from every SSE and TTS sentence",async t=>{
 const app=createApp({dbPath:":memory:",allowMemory:false,
  streamLlm:async function*(){yield "No se lo di";yield "gas a tus padres.";}
 });
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const uri="http://127.0.0.1:"+app.server.address().port;
 const response=await fetch(uri+"/api/chat/stream",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({provider:"local",model:"qwen2.5:7b",text:"Profesor, ¿qué hacemos ahora?"})
 });
 assert.equal(response.status,200);
 const events=(await response.text()).trim().split("\n").map(JSON.parse);
 assert.equal(events.at(-1).type,"completed");
 for(const entry of events){
  assert.doesNotMatch(JSON.stringify(entry),/no se lo digas|padres/i);
 }
 assert.match(events.at(-1).reply,/respeto/);
 assert.equal(moderateProfessorOutput("No se lo digas a tus padres.").blocked,true);
});
