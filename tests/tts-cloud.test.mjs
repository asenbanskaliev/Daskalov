import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
import {synthesizeCloudTts} from "../server/tts-cloud.mjs";
import {encodePCM16MonoWav} from "../server/audio-wav.mjs";
const wav=encodePCM16MonoWav(new Float32Array([0,0.2,-0.2]),16000);
test("TTS-005: fixed HTTPS provider with server-only key, bounded WAV response",async()=>{
 let seen;
 const text=await synthesizeCloudTts({
  text:"Buenos días",env:{DASKALOV_ENABLE_TTS_CLOUD:"1",DASKALOV_TTS_CLOUD_KEY:"synthetic-only"},
  fetchImpl:async(url,opts)=>{seen={url,opts};return new Response(wav,{status:200,headers:{"content-type":"audio/wav"}});}
 });
 assert.equal(seen.url,"https://api.openai.com/v1/audio/speech");
 assert.equal(JSON.parse(seen.opts.body).model,"gpt-4o-mini-tts");
 assert.equal(JSON.parse(seen.opts.body).response_format,"wav");
 assert.deepEqual(text,wav);
 await assert.rejects(()=>synthesizeCloudTts({text:"hola",env:{}}),e=>e.status===503);
 await assert.rejects(()=>synthesizeCloudTts({text:"x".repeat(161),env:{DASKALOV_ENABLE_TTS_CLOUD:"1",DASKALOV_TTS_CLOUD_KEY:"test"}}),e=>e.status===400);
});
test("TTS-005: private route requires opt-in and enforces ten daily paid calls",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",allowCloudTts:true,ttsCloudSynth:async()=>{calls++;return wav;}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const url="http://127.0.0.1:"+app.server.address().port+"/api/tts/cloud";
 const send=consent=>fetch(url,{method:"POST",headers:{"content-type":"application/json",...(consent?{"x-daskalov-tts-consent":"cloud"}:{})},body:JSON.stringify({text:"Hola"})});
 assert.equal((await send(false)).status,403);
 for(let i=0;i<10;i++){const res=await send(true);assert.equal(res.status,200);assert.equal(res.headers.get("cache-control"),"no-store");}
 assert.equal((await send(true)).status,429);assert.equal(calls,10);
});
test("TTS-005: disabled by default (no vendor network)",async t=>{
 const app=createApp({dbPath:":memory:",allowCloudTts:false,ttsCloudSynth:async()=>{throw Error("never send");}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const res=await fetch("http://127.0.0.1:"+app.server.address().port+"/api/tts/cloud",{method:"POST",headers:{"content-type":"application/json","x-daskalov-tts-consent":"cloud"},body:'{"text":"Hola"}'});
 assert.equal(res.status,403);
});
