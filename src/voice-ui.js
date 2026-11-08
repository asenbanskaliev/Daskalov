import {mapSpanishGrapheme} from "./visemes.js";
import {BrowserSpeechQueue} from "./speech.js";
import {LocalPiperVoice} from "./tts-local.js";
import {AudioLipSync} from "./audio-lipsync.js";
import {VoiceMetrics} from "./voice-metrics.js";
import {readSetting,writeSetting} from "./settings.js";

export function createVoiceUI({find,onSpeaking=()=>{},onViseme=()=>{},onError=()=>{}}){
 let enabled=true;
 const stats=new VoiceMetrics();
 const speech=new BrowserSpeechQueue({onSentenceStart:text=>onViseme(mapSpanishGrapheme(text)),onBoundary:({text,charIndex})=>onViseme(mapSpanishGrapheme(text.slice(charIndex,charIndex+3))),onSpeaking:active=>{
  onSpeaking(active);
  if(active)stats.audioStart();
  if(!active)onViseme("REST");
  find("pauseVoice").disabled=!active;
  find("resumeVoice").disabled=active||!enabled;
 }});
 const lip=new AudioLipSync({onViseme});
 let lipFrame=0,lipActive=false;
 const runLipFrame=()=>{
  lipFrame=0;
  if(!lipActive)return;
  lip.tick();
  lipFrame=window.requestAnimationFrame(runLipFrame);
 };
 const local=new LocalPiperVoice({
  onSpeaking:active=>{
   onSpeaking(active);
   if(active)stats.audioStart();
   lipActive=active;
   if(active&&!lipFrame)lipFrame=window.requestAnimationFrame(runLipFrame);
   if(!active){onViseme("REST");}
  },
  onAudioFragment:fragment=>{stats.fragment(fragment);lip.schedule(fragment);},
  onSentenceStart:text=>onViseme(mapSpanishGrapheme(text)),onError
 });
 const cloud=new LocalPiperVoice({
  endpoint:"/api/tts/cloud",
  cloudConsent:()=>find("cloudTtsConsent")?.checked===true,
  onSpeaking:active=>{
   onSpeaking(active);
   if(active)stats.audioStart();
   lipActive=active;
   if(active&&!lipFrame)lipFrame=window.requestAnimationFrame(runLipFrame);
   if(!active)onViseme("REST");
  },
  onAudioFragment:fragment=>{stats.fragment(fragment);lip.schedule(fragment);},
  onSentenceStart:text=>onViseme(mapSpanishGrapheme(text)),onError
 });
 const choice=find("ttsMode");
 choice.value=readSetting("ttsMode")||"browser";
 const selected=()=>choice.value==="local"?local:choice.value==="cloud"?cloud:speech;
 function cancel(){stats.cancel();speech.cancel();local.cancel();cloud.cancel();lipActive=false;if(lipFrame)window.cancelAnimationFrame(lipFrame);lipFrame=0;lip.cancel();onViseme("REST");}
 function populate(){
  const select=find("voiceChoice"),previous=select.value;
  select.replaceChildren();
  const first=document.createElement("option");
  first.value="";first.textContent="Voz predeterminada";select.append(first);
  for(const voice of speech.listVoices()){
   const option=document.createElement("option");
   option.value=voice.name;option.textContent=voice.name;select.append(option);
  }
  select.value=previous&&[...select.options].some(x=>x.value===previous)?previous:"";
 }
 choice.addEventListener("change",()=>{
  cancel();writeSetting("ttsMode",choice.value);
  find("voiceChoice").disabled=choice.value!=="browser";
  updateCostInfo();
 });
 function updateCostInfo(){
  const note=find("ttsCostInfo");
  if(note)note.textContent=choice.value==="cloud"?"Cloud TTS: proveedor de pago; máximo 10 peticiones diarias en este servidor privado, previa autorización.":choice.value==="local"?"Piper local: no usa Cloud, consume recursos del equipo y requiere licencia de voz.":"Voz del navegador: puede utilizar servicios del sistema; sin cargo desde la aplicación.";
 }
 updateCostInfo();
 find("cloudTtsConsent")?.addEventListener("change",()=>{
  if(!find("cloudTtsConsent").checked){cloud.cancel();onViseme("REST");}
 });
  find("voiceChoice").addEventListener("change",()=>speech.setVoiceName(find("voiceChoice").value));
 find("pauseVoice").addEventListener("click",()=>{
  selected().pause();find("resumeVoice").disabled=false;
 });
 find("resumeVoice").addEventListener("click",()=>{
  selected().resume();find("resumeVoice").disabled=true;
 });
 populate();
 window.speechSynthesis?.addEventListener?.("voiceschanged",populate);
 return {
  beginTurn(){stats.beginTurn();},
  getStats(){return stats.snapshot();},
  speak(text){return selected().speak(text);},
  cancel,
  setEnabled(value){
   enabled=Boolean(value);
   speech.setEnabled(enabled);
   local.setEnabled(enabled);
   cloud.setEnabled(enabled);
  },
  setDemoMode(demo){
   if(demo)cancel();
   find("voiceChoice").disabled=demo||choice.value!=="browser";
   find("pauseVoice").disabled=true;
   find("resumeVoice").disabled=true;
   this.setEnabled(!demo&&find("voiceEnabled").checked);
  }
 };
}
