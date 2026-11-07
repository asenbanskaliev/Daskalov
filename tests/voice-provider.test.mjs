import test from "node:test";
import assert from "node:assert/strict";
import {createTTSProvider} from "../src/tts-provider.js";
import {encodePCM16MonoWav,validateWaveHeader} from "../server/audio-wav.mjs";
test("TTS-001: los adaptadores browser/local/disabled comparten contrato",()=>{
 const browser=createTTSProvider("browser",{browser:{speak:()=>true,cancel(){},pause(){},resume(){},listVoices:()=>[]}});
 const off=createTTSProvider("disabled");
 const local=createTTSProvider("local",{local:{speak:()=>true,cancel(){},pause(){},resume(){},listVoices:()=>[]}});
 for(const tts of [browser,local,off]){
  assert.equal(typeof tts.speak,"function");
  assert.equal(typeof tts.cancel,"function");
  assert.equal(typeof tts.pause,"function");
  assert.equal(typeof tts.resume,"function");
  assert.ok(Array.isArray(tts.voices()));
 }
 assert.equal(off.speak("Hola"),false);
});
test("TTS-004: audio WAV PCM16 mono tiene cabecera y duración correctas",()=>{
 const bytes=encodePCM16MonoWav(new Float32Array([0,-1,.5,1]),16000);
 const info=validateWaveHeader(bytes);
 assert.equal(info.sampleRate,16000);assert.equal(info.channels,1);assert.equal(info.dataBytes,8);
});
