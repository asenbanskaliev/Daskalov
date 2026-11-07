import test from "node:test";
import assert from "node:assert/strict";
import {LocalWhisperRecorder} from "../src/local-stt.js";
import {createSTTAdapter} from "../src/stt.js";
test("STT-004: local recording requests microphone only on user start; stops tracks",async()=>{
 let requested=0,trackStop=0;
 const mediaDevices={async getUserMedia(){requested++;return {getTracks(){return [{stop(){trackStop++;}}]}};}};
 class Recorder{
  static isTypeSupported(){return true;}
  constructor(){this.state="inactive";}start(){this.state="recording";}
  stop(){this.state="inactive";this.ondataavailable?.({data:new Blob([new Uint8Array(128)])});this.onstop?.();}
 }
 let uploaded;
 const service=new LocalWhisperRecorder({mediaDevices,MediaRecorderCtor:Recorder,fetchImpl:async(url,opts)=>{
  uploaded={url,opts};return Response.json({transcript:"¿Puedo levantar la mano?"});
 }});
 assert.equal(requested,0);
 const task=service.start();
 for(let i=0;i<20&&!service.recorder;i++)await new Promise(resolve=>setTimeout(resolve,1));
 service.finish();
 assert.equal(await task,"¿Puedo levantar la mano?");
 assert.equal(requested,1);assert.equal(trackStop,1);
 assert.equal(uploaded.url,"/api/stt/local");
 assert.equal(uploaded.opts.headers["content-type"],"audio/webm");
});
test("STT-006: local provider cancels speech before recording and stop cancels the capture",async()=>{
 let speakingCancelled=0,stopped=0;
 const recorder=()=>Promise.resolve("Hola");
 recorder.cancel=()=>stopped++;
 recorder.finish=()=>{};
 const results=[];
 const adapter=createSTTAdapter({mode:"localWhisper",localTranscriber:recorder,onBargeIn:()=>speakingCancelled++,onTranscript:text=>results.push(text)});
 assert.equal(adapter.available,true);
 adapter.start();
 await new Promise(resolve=>setTimeout(resolve,1));
 assert.equal(speakingCancelled,1);
 assert.deepEqual(results,["Hola"]);
 adapter.stop();
 assert.equal(stopped,1);
});
