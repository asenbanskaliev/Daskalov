import test from "node:test";
import assert from "node:assert/strict";
import {AudioQueue} from "../src/audio-queue.js";
test("TTS-006: scheduler emits decoded duration and real audio clock for viseme synchronization",async()=>{
 const callbacks=[];
 let finish,sourceStarts=0;
 class Source {
  connect(){}
  start(){sourceStarts++;}
  stop(){this.onended?.();}
 }
 class FakeCtx {
  constructor(){this.currentTime=4.5;this.destination={};}
  async resume(){}
  async decodeAudioData(){return {duration:.8};}
  createBufferSource(){
   const src=new Source();
   finish=()=>src.onended?.();
   return src;
  }
 }
 const q=new AudioQueue({AudioContextCtor:FakeCtx,onFragmentStart:v=>callbacks.push(v)});
 const pending=q.enqueue(new ArrayBuffer(40),{text:"Chico",fragmentId:"first"});
 for(let i=0;i<20&&!callbacks.length;i++)await new Promise(r=>setTimeout(r,1));
 assert.equal(sourceStarts,1);
 assert.equal(callbacks[0].durationMs,800);
 assert.equal(callbacks[0].audioStartMs,4500);
 assert.equal(callbacks[0].clockMs(),4500);
 assert.equal(callbacks[0].fragmentId,"first");
 finish();await pending;await q.close();
});
