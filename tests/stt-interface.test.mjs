import test from "node:test";
import assert from "node:assert/strict";
import {createSTTAdapter,STT_MODES} from "../src/stt.js";
test("STT-001: interfaz webSpeech/localWhisper/disabled con contratos homogéneos",()=>{
 assert.deepEqual(STT_MODES,["webSpeech","localWhisper","disabled"]);
 const disabled=createSTTAdapter({mode:"disabled"});
 assert.equal(disabled.available,false);
 assert.equal(typeof disabled.start,"function");
 assert.equal(typeof disabled.stop,"function");
 const fake={start(){this.started=true;},abort(){this.aborted=true;},stop(){}};
 const web=createSTTAdapter({mode:"webSpeech",recognitionFactory:()=>fake});
 assert.equal(web.available,true);
 web.start();web.stop();
 assert.equal(fake.started,true);assert.equal(fake.aborted,true);
});
test("STT-006: new recognition cancels previous TTS before active microphone",()=>{
 let cancelled=0;
 const recognition={start(){},abort(){},stop(){}};
 const adapter=createSTTAdapter({mode:"webSpeech",recognitionFactory:()=>recognition,onBargeIn:()=>cancelled++});
 adapter.start();
 assert.equal(cancelled,1);
});

test("STT-001: contrato parcial/final sin enviar una sílaba incompleta como pregunta",()=>{
 let fake,final=[],partial=[];
 const adapter=createSTTAdapter({mode:"webSpeech",recognitionFactory:()=>{
  fake={start(){},abort(){}};return fake;
 },onTranscript:t=>final.push(t),onPartial:t=>partial.push(t)});
 adapter.start();
 fake.onresult({resultIndex:0,results:[{0:{transcript:"La piza"},isFinal:false}]});
 assert.deepEqual(final,[]);
 assert.deepEqual(partial,["La piza"]);
 fake.onresult({resultIndex:0,results:[{0:{transcript:"La pizarra"},isFinal:true}]});
 assert.deepEqual(final,["La pizarra"]);
});
