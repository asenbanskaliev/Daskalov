import test from "node:test";
import assert from "node:assert/strict";
import {AudioQueue} from "../src/audio-queue.js";
import {LocalPiperVoice} from "../src/tts-local.js";
test("TTS-006: audio queue serializes playback and supports interruption",async()=>{
 let sources=0,active=0,peak=0,ends=[];
 class Source{
  connect(){}start(){sources++;active++;peak=Math.max(peak,active);ends.push(()=>this.onended?.());}
  stop(){if(active)active--;this.onended?.();}
 }
 class AudioContext{
  get destination(){return {};}async resume(){}async suspend(){}
  async decodeAudioData(){return {duration:.1};}
  createBufferSource(){return new Source();}
 }
 const changes=[],q=new AudioQueue({AudioContextCtor:AudioContext,onSpeaking:x=>changes.push(x)});
 const a=q.enqueue(new ArrayBuffer(10)),b=q.enqueue(new ArrayBuffer(10));
 for(let i=0;i<20&&sources===0;i++)await new Promise(r=>setTimeout(r,1));
 assert.equal(sources,1);
 active--;ends.shift()();
 await a;
 for(let i=0;i<20&&sources<2;i++)await new Promise(r=>setTimeout(r,1));
 assert.equal(sources,2);assert.equal(peak,1);
 q.cancel();await b;
 assert.ok(changes.includes(false));
});
test("TTS-001: local voice sends only text to same-origin Piper and cancels pending",async()=>{
 let seen=null;
 const voice=new LocalPiperVoice({fetchImpl:async(url,opts)=>{
  seen={url,opts};
  return {ok:true,arrayBuffer:async()=>new ArrayBuffer(12)};
 },AudioQueueFactory:()=>({enqueue:async()=>{},cancel(){},pause(){},resume(){}})});
 assert.equal(voice.speak("¡Hola clase!"),true);
 for(let i=0;i<20&&!seen;i++)await new Promise(r=>setTimeout(r,1));
 assert.equal(seen.url,"/api/tts/local");
 assert.equal(JSON.parse(seen.opts.body).text,"¡Hola clase!");
 voice.cancel();
});
