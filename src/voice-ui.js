import {BrowserSpeechQueue} from "./speech.js";
import {LocalPiperVoice} from "./tts-local.js";
import {readSetting,writeSetting} from "./settings.js";

export function createVoiceUI({find,onSpeaking=()=>{},onError=()=>{}}){
 let enabled=true;
 const speech=new BrowserSpeechQueue({onSpeaking:active=>{
  onSpeaking(active);
  find("pauseVoice").disabled=!active;
  find("resumeVoice").disabled=active||!enabled;
 }});
 const local=new LocalPiperVoice({onSpeaking,onError});
 const choice=find("ttsMode");
 choice.value=readSetting("ttsMode")||"browser";
 const selected=()=>choice.value==="local"?local:speech;
 function cancel(){speech.cancel();local.cancel();}
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
  speak(text){return selected().speak(text);},
  cancel,
  setEnabled(value){
   enabled=Boolean(value);
   speech.setEnabled(enabled);
   local.setEnabled(enabled);
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
