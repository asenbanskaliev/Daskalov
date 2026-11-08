import test from "node:test";
import assert from "node:assert/strict";
import {LocalPiperVoice} from "../src/tts-local.js";
import {AudioQueue} from "../src/audio-queue.js";
test("TTS-006: 3 async Piper fetches may finish out of order but audio plays in speech order",async()=>{
 const inflight=[],played=[];
 const voice=new LocalPiperVoice({
  fetchImpl:(_url,opts)=>new Promise(resolve=>inflight.push({resolve,text:JSON.parse(opts.body).text})),
  AudioQueueFactory:()=>({
   async enqueue(_audio,{text}){played.push(text);return true;},
   cancel(){},pause(){},resume(){}
  })
 });
 voice.speak("uno");voice.speak("dos");voice.speak("tres");
 assert.equal(inflight.length,3);
 for(const index of [2,1,0])inflight[index].resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});
 for(let i=0;i<30&&played.length<3;i++)await new Promise(r=>setTimeout(r,1));
 assert.deepEqual(played,["uno","dos","tres"]);
 voice.cancel();
});
test("TTS-006: streamed independently decodable WAV fragments play once and cancel cleanly",async()=>{
 let starts=0,done;
 class Source{connect(){}start(){starts++;queueMicrotask(()=>{this.onended?.();});}stop(){this.onended?.();}}
 class FakeContext{constructor(){this.currentTime=1;this.destination={};}async resume(){}async suspend(){}async close(){}async decodeAudioData(){return {duration:.1};}createBufferSource(){return new Source();}}
 const q=new AudioQueue({AudioContextCtor:FakeContext});
 async function* chunks(){yield {audio:new ArrayBuffer(15),text:"hola"};yield {audio:new ArrayBuffer(15),text:"clase"};}
 const result=await q.enqueueStream(chunks());
 assert.equal(result.played,2);assert.equal(starts,2);
 await q.close();
});
