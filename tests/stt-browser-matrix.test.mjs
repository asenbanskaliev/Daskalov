import test from "node:test";
import assert from "node:assert/strict";
import {assessSttBrowserMatrix,STT_DIFFICULT_IDS,STT_BROWSER_TARGETS} from "../scripts/voice-validation.mjs";
const fixture=()=>STT_BROWSER_TARGETS.map(browser=>({browser,
 cases:STT_DIFFICULT_IDS.map((id,i)=>({id,expected:"pregunta de prueba "+(i+1),actual:"pregunta de prueba "+(i+1),realAudioVerified:true}))}));
test("STT-004: 20 identical difficult-case references across Chrome/Edge/Firefox, no transcripts leaked",()=>{
 const report=assessSttBrowserMatrix(fixture());
 assert.equal(report.schema,"daskalov-stt-browser-matrix-v1");
 assert.equal(report.submittedAudioClaims,60);
 assert.equal(report.byBrowser.chrome.samples,20);
 assert.equal(report.byBrowser.edge.meanWer,0);
 assert.equal(report.byBrowser.firefox.cases.length,20);
 assert.equal(report.releaseApproved,false);
 assert.equal(report.independentEvidenceVerified,false);
 assert.equal(report.noTranscriptsExported,true);
 assert.ok(!JSON.stringify(report).includes("pregunta de prueba"));
});
test("STT-004: partial samples, duplicates and inconsistent references are refused",()=>{
 const missingBrowser=fixture().slice(0,2);
 assert.throws(()=>assessSttBrowserMatrix(missingBrowser),/Chrome, Edge y Firefox/);
 const short=fixture();short[0].cases.pop();
 assert.throws(()=>assessSttBrowserMatrix(short),/20 audios/);
 const duplicated=fixture();duplicated[0].cases[1].id="AUDIO-01";
 assert.throws(()=>assessSttBrowserMatrix(duplicated),/duplicado/);
 const fake=fixture();fake[0].cases[0].realAudioVerified=false;
 assert.throws(()=>assessSttBrowserMatrix(fake),/audio real/);
 const mismatch=fixture();mismatch[2].cases[4].expected="otra referencia";
 assert.throws(()=>assessSttBrowserMatrix(mismatch),/diferente/);
 const unknown=fixture();unknown[1].cases[3].id="OTHER";
 assert.throws(()=>assessSttBrowserMatrix(unknown),/exactamente AUDIO/);
});
