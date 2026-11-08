import test from "node:test";
import assert from "node:assert/strict";
import {transcribeLocalWhisper,localWhisperAddress} from "../server/stt-whisper.mjs";
test("STT-004: formato, tamaño y destino de Whisper local se restringen",async()=>{
 assert.throws(()=>localWhisperAddress({DASKALOV_WHISPER_URL:"http://external.example/"}),e=>e.status===503);
 assert.throws(()=>localWhisperAddress({DASKALOV_WHISPER_URL:"http://127.0.0.1:8080/inject"}),e=>e.status===503);
 assert.equal(localWhisperAddress({DASKALOV_WHISPER_URL:"http://127.0.0.1:8080/"}),"http://127.0.0.1:8080");
 await assert.rejects(()=>transcribeLocalWhisper({audio:Buffer.alloc(20),mime:"audio/mp3",env:{DASKALOV_WHISPER_URL:"http://127.0.0.1:8080/"}}),e=>e.status===415);
 await assert.rejects(()=>transcribeLocalWhisper({audio:Buffer.alloc(2100000),mime:"audio/webm",env:{DASKALOV_WHISPER_URL:"http://127.0.0.1:8080/"}}),e=>e.status===413);
});
test("STT-005: sin Cloud, audio solo viaja a servidor de loopback",async()=>{
 let seen;
 const text=await transcribeLocalWhisper({
  audio:Buffer.alloc(128),mime:"audio/webm",
  env:{DASKALOV_WHISPER_URL:"http://127.0.0.1:8080/"},
  fetchImpl:async(url,opts)=>{seen={url,opts};return Response.json({text:"  Buenos días, profesor  "});}
 });
 assert.equal(text,"Buenos días, profesor");
 assert.equal(seen.url,"http://127.0.0.1:8080/inference");
 assert.equal(seen.opts.body.get("language"),"es");
 assert.equal(seen.opts.body.get("response_format"),"json");
});
test("STT-004: respuesta vacía rechazada sin persistencia",async()=>{
 await assert.rejects(()=>transcribeLocalWhisper({
  audio:Buffer.alloc(128),env:{DASKALOV_WHISPER_URL:"http://127.0.0.1:8080/"},
  fetchImpl:async()=>Response.json({text:""})
 }),e=>e.status===422);
});
