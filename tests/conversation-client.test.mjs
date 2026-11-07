import test from "node:test";
import assert from "node:assert/strict";
import {streamTurn,TurnProtocolError} from "../src/conversation.js";
import {BrowserSpeechQueue} from "../src/speech.js";

function fakeResponse(events){
 const text=events.map(x=>JSON.stringify(x)).join("\n")+"\n";
 return new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(text));controller.close();}}),{status:200});
}
const id="00000000-0000-4000-8000-000000000011";
test("LLM-001: cliente valida orden y mantiene requestId",async()=>{
 const events=[{type:"started",requestId:id,sequence:0},{type:"delta",requestId:id,sequence:1,text:"¡Hola!"},{type:"sentence",requestId:id,sequence:2,text:"¡Hola!"},{type:"completed",requestId:id,sequence:3,reply:"¡Hola!"}];
 const received=[];
 for await(const e of streamTurn({body:{text:"Hola"},fetchImpl:async()=>fakeResponse(events)}))received.push(e);
 assert.deepEqual(received,events);
});
test("LLM-001: cliente rechaza mensajes de otro turno o desordenados",async()=>{
 const events=[{type:"started",requestId:id,sequence:0},{type:"delta",requestId:"otro",sequence:1,text:"texto"}];
 await assert.rejects(async()=>{for await(const e of streamTurn({body:{},fetchImpl:async()=>fakeResponse(events)})){}},TurnProtocolError);
});
test("TTS-001: TTS navegador admite frases y cancelación sin dependencia de IA",()=>{
 const items=[],changes=[];
 class FakeUtterance{constructor(text){this.text=text;}}
 const synth={getVoices:()=>[{lang:"es-ES",name:"Prueba"}],speak:utterance=>{items.push(utterance);utterance.onstart?.();},cancel:()=>{changes.push("cancel");}};
 const speaker=new BrowserSpeechQueue({synthesis:synth,Utterance:FakeUtterance,onSpeaking:value=>changes.push(value)});
 assert.equal(speaker.speak("Hola alumno"),true);
 assert.equal(items[0].voice.lang,"es-ES");
 assert.ok(changes.includes(true));
 speaker.cancel();
 assert.ok(changes.includes(false));
 speaker.setEnabled(false);
 assert.equal(speaker.speak("No sonar"),false);
});
