import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BrowserSpeechQueue} from "../src/speech.js";
test("WEB-005/007: focus, labels, captions and voice controls are present",()=>{
 const html=readFileSync("index.html","utf8");
 const css=readFileSync("src/style.css","utf8");
 for(const id of ["graphicsQuality","voiceChoice","providerStatus","reducedMotion","pauseVoice","resumeVoice","micStatus","memoryPermission"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/href="#question"/);
 assert.match(html,/aria-live="polite"/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});
test("WEB-007: TTS voice list and pause/resume work without an LLM",()=>{
 const actions=[];
 const synth={getVoices:()=>[{name:"Voz Española",lang:"es-ES"},{name:"English",lang:"en-US"}],speak:x=>actions.push(x),pause:()=>actions.push("pause"),resume:()=>actions.push("resume"),cancel:()=>actions.push("cancel")};
 class Utterance{constructor(text){this.text=text;}}
 const queue=new BrowserSpeechQueue({synthesis:synth,Utterance});
 assert.equal(queue.listVoices().length,1);
 queue.setVoiceName("Voz Española");
 assert.equal(queue.speak("Hola"),true);
 assert.equal(actions[0].voice.name,"Voz Española");
 queue.pause();queue.resume();queue.cancel();
 assert.deepEqual(actions.slice(1),["pause","resume","cancel"]);
});
