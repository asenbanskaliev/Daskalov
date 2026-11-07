import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {createApp} from "../server/main.mjs";
import {encodePCM16MonoWav} from "../server/audio-wav.mjs";
test("TTS-004: Piper HTTP local validates text, type, WAV and no-store",async t=>{
 let calls=0;
 const app=createApp({dbPath:":memory:",ttsSynth:async({text})=>{calls++;assert.equal(text,"Buenos días");return encodePCM16MonoWav(new Float32Array([0,.4,-.4]),16000);}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const post=text=>fetch(base+"/api/tts/local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text})});
 let r=await post("Buenos días");assert.equal(r.status,200);assert.match(r.headers.get("content-type"),/audio\/wav/);
 assert.match(r.headers.get("cache-control"),/no-store/);
 assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0,4).toString(),"RIFF");
 r=await post("x".repeat(161));assert.equal(r.status,400);assert.equal(calls,1);
});
