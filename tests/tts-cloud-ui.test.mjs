import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LocalPiperVoice} from "../src/tts-local.js";
import {createTTSProvider,TTS_MODES} from "../src/tts-provider.js";
test("TTS-009: browser/local/cloud share provider contract",()=>{
 assert.deepEqual(TTS_MODES,["browser","local","cloud","disabled"]);
 const remote=createTTSProvider("cloud",{cloud:{speak:()=>true,cancel(){},pause(){},resume(){},listVoices:()=>[]}});
 assert.equal(remote.available,true);assert.equal(remote.speak("Hola"),true);
});
test("TTS-005: browser cannot speak Cloud without an opt-in; consent is never persisted",()=>{
 let fetched=0,errors=0,consent=false;
 const voice=new LocalPiperVoice({endpoint:"/api/tts/cloud",cloudConsent:()=>consent,onError:()=>errors++,
  fetchImpl:async()=>{fetched++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(20)};},
  AudioQueueFactory:()=>({enqueue:async()=>true,cancel(){},pause(){},resume(){}})
 });
 assert.equal(voice.speak("Hola"),false);
 assert.equal(fetched,0);assert.equal(errors,1);
 const html=readFileSync("index.html","utf8"),ui=readFileSync("src/voice-ui.js","utf8");
 assert.match(html,/id="cloudTtsConsent"/);
 assert.match(html,/id="ttsCostInfo"/);
 assert.doesNotMatch(ui,/writeSetting\("cloudTtsConsent"/);
 voice.cancel();
});
