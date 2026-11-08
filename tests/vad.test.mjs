import test from "node:test";
import assert from "node:assert/strict";
import {VADTracker} from "../src/vad.js";
test("STT-003: corta tras hablar y luego silencio largo, nunca por 200 ms de pausa",()=>{
 const detector=new VADTracker({threshold:.04,minSpeechMs:350,minSilenceMs:1100,maxDurationMs:15000});
 assert.equal(detector.feed(.08,0).finished,false);
 assert.equal(detector.feed(.08,380).heardSpeech,true);
 assert.equal(detector.feed(.01,600).finished,false);
 assert.equal(detector.feed(.08,820).finished,false);
 assert.equal(detector.feed(.01,1300).finished,false);
 assert.equal(detector.feed(.01,2399).finished,false);
 assert.equal(detector.feed(.01,2400).reason,"silence");
});
test("STT-003: una sílaba demasiado corta no inicia fin de turno",()=>{
 const detector=new VADTracker();
 detector.feed(.08,0);detector.feed(.01,200);
 assert.equal(detector.feed(.01,2000).finished,false);
 assert.equal(detector.heardSpeech,false);
});
test("STT-003: evita grabación infinita aunque no detecte palabras",()=>{
 const detector=new VADTracker({maxDurationMs:10000});
 detector.feed(0,0);
 assert.equal(detector.feed(0,10001).reason,"maximum");
});
