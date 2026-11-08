import test from "node:test";
import assert from "node:assert/strict";
import {wordErrorRate,assessAsrBatch,compareTtsEngines,blindVoicePanel} from "../scripts/voice-validation.mjs";
test("STT-004: Spanish WER ignores accents but counts wrong words",()=>{
 assert.equal(wordErrorRate("¿Cómo estás?","como estas"),0);
 assert.equal(wordErrorRate("Hola profesor","Hola profesora"),.5);
 const batch=assessAsrBatch([{id:"A01",expected:"La pizarra",actual:"La pizarra"},{id:"A02",expected:"Buenos días",actual:"Buenos tardes"}]);
 assert.equal(batch.samples,2);
 assert.equal(batch.meanWer,.25);
 assert.equal(batch.noTranscriptsExported,true);
 assert.ok(!JSON.stringify(batch).includes("Buenos tardes"));
 assert.equal(batch.actualAudioProvided,false);
});
test("TTS-003: engine RTF comparison never claims unverified licenses",()=>{
 const report=compareTtsEngines([
  {engine:"piper",synthesisMs:300,audioDurationMs:1000,licenseVerified:true},
  {engine:"kokoro",synthesisMs:500,audioDurationMs:1000,licenseVerified:false}
 ]);
 assert.equal(report.piper.rtfP50,.3);
 assert.equal(report.kokoro.allLicensesVerified,false);
});
test("TTS-008: blind voice rubric requires three unique judges and valid 1-5 votes",()=>{
 const votes=[1,2,3].map(i=>({judgeId:"J"+i,voiceId:"VOICE_A",intelligibility:4,naturalness:3,pronunciation:4,educationalAppropriateness:5}));
 assert.equal(blindVoicePanel(votes).byVoice.VOICE_A.votes,3);
 assert.equal(blindVoicePanel(votes).licenseAuditStillRequired,true);
 assert.throws(()=>blindVoicePanel(votes.slice(0,2)),/tres/);
});
