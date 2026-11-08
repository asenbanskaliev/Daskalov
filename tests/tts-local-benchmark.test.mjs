import test from "node:test";
import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import {encodePCM16MonoWav} from "../server/audio-wav.mjs";
import {benchmarkVoiceEngines,validateVoiceCommands,ORIGINAL_TEST_LINES} from "../scripts/tts-local-benchmark.mjs";
const config={engines:[
 {engine:"piper",executable:"/trusted/piper",args:["--model","es.onnx","--output_file","{output}"],textMode:"stdin"},
 {engine:"kokoro",executable:"/trusted/kokoro",args:["--text","{text}","--output","{output}"],textMode:"argument"}
]};
test("TTS-003: operator commands must define both local engines, no shell needed",()=>{
 assert.equal(validateVoiceCommands(config).length,2);
 assert.throws(()=>validateVoiceCommands({engines:[config.engines[0]]}),/Piper y Kokoro/);
 assert.throws(()=>validateVoiceCommands({engines:[config.engines[0],{...config.engines[1],args:[]}]}),/WAV/);
});
test("TTS-003: same Spanish sentences, actual WAV timing and no false licensing claim",async()=>{
 const calls=[];
 const run=async({entry,text,output})=>{
  calls.push({engine:entry.engine,text});
  await writeFile(output,encodePCM16MonoWav(new Float32Array(16000),16000));
  return entry.engine==="piper"?120:250;
 };
 await assert.rejects(()=>benchmarkVoiceEngines({config,run,env:{}}),/consentimiento/);
 assert.equal(calls.length,0);
 const report=await benchmarkVoiceEngines({config,run,env:{DASKALOV_VOICE_BENCHMARK_CONSENT:"1"}});
 assert.equal(report.comparisons,6);
 assert.equal(report.engines.piper.rtfP50,.12);
 assert.equal(report.engines.kokoro.rtfP50,.25);
 assert.equal(report.engines.piper.allLicensesVerified,false);
 assert.equal(report.releaseApproved,false);
 assert.deepEqual(calls.filter(x=>x.engine==="piper").map(x=>x.text),ORIGINAL_TEST_LINES);
 assert.deepEqual(calls.filter(x=>x.engine==="kokoro").map(x=>x.text),ORIGINAL_TEST_LINES);
 assert.ok(!ORIGINAL_TEST_LINES.some(x=>JSON.stringify(report).includes(x)));
});
test("TTS-003: invalid WAV must fail closed",async()=>{
 await assert.rejects(()=>benchmarkVoiceEngines({config,env:{DASKALOV_VOICE_BENCHMARK_CONSENT:"1"},
  run:async({output})=>{await writeFile(output,Buffer.from("INVALID"));return 30;}
 }),/WAV inválido/);
});
