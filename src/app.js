import {streamTurn} from "./conversation.js";
import {createVoiceUI} from "./voice-ui.js";
import {createClassroomScene} from "./scene.js";
import {bindCameraKeyboard} from "./camera-input.js";
import {$,showMessage} from "./dom-ui.js";
import {readSetting,writeSetting,createSettingsUI} from "./settings.js";
import {createMemoryUI} from "./memory-ui.js";
import {configureVoiceInput} from "./voice-input.js";
import {demoReply} from "./demo.js";
import {createGameUI} from "./game-ui.js";

const history=[];
let busy=false,playing=false,yaw=0,sceneState=null,activeController=null,activeTurn=0;
const voice=createVoiceUI({
 find:$,
 onSpeaking:active=>{playing=active;},
 onViseme:value=>sceneState?.setViseme?.(value),
 onError:error=>showMessage("error","Voz Piper local: "+error.message)
});
const settings=createSettingsUI({find:$,showMessage});
let gameUI=null;
const memoryUI=createMemoryUI({
 find:$,showMessage,history,
 onSession:async token=>{
  try{
   const response=await fetch("/api/progress",{method:"POST",headers:{"content-type":"application/json","x-daskalov-csrf":token},body:JSON.stringify({readOnly:true})});
   if(response.ok)gameUI?.restore((await response.json()).progress);
  }catch{}
 }
});
$("graphicsQuality").value=readSetting("graphicsQuality")||"auto";
$("reducedMotion").checked=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
$("graphicsQuality").addEventListener("change",()=>{
 writeSetting("graphicsQuality",$("graphicsQuality").value);
 sceneState?.setQuality($("graphicsQuality").value);
});
$("provider").value=readSetting("provider")||"cloud";
$("model").value=readSetting("model")||"beam";
async function send(text,event="dialog"){
 text=String(text).trim();
 if(!text)return;
 const provider=$("provider").value,model=$("model").value.trim();
 if(provider==="demo"){
  activeController?.abort();voice.cancel();
  const answer=demoReply(text,{event});
  showMessage("user",text);
  showMessage("assistant",answer.reply);
  $("speechBubble").textContent="«"+answer.reply+"»";
  sceneState?.act(answer.animation);
  return;
 }
 if(!model){showMessage("error","Selecciona un modelo.");return;}
 const remember=$("remember").checked;
 const turn=++activeTurn;
 activeController?.abort();
 voice.cancel();
 const controller=new AbortController();
 activeController=controller;
 busy=true;
 $("sendButton").disabled=true;
 $("stopButton").disabled=false;
 $("sendButton").textContent="Pensando…";
 const prompt=event==="turned_around"?"(Te giras para mirar detrás)":text;
 showMessage("user",prompt);
 const answer=showMessage("assistant","Daskalov está pensando…");
 $("speechBubble").textContent="Daskalov está pensando…";
 let partial="",completed=false;
 try{
  if(remember)await memoryUI.ensure();
  voice.setEnabled($("voiceEnabled").checked);
  for await(const eventData of streamTurn({
   body:{provider,model,text,event,remember,allowFallbackToCloud:provider==="local"&&$("cloudFallback").checked,history:history.slice(-8)},
   signal:controller.signal,
   csrfToken:remember?memoryUI.csrfToken:null
  })){
   if(turn!==activeTurn||controller.signal.aborted)break;
   if(eventData.type==="started"){
    answer.textContent="Escuchando al profesor…";
   }else if(eventData.type==="delta"){
    partial+=eventData.text;
    answer.textContent=partial;
    $("speechBubble").textContent="«"+partial+"»";
   }else if(eventData.type==="sentence"){
    voice.speak(eventData.text);
   }else if(eventData.type==="provider-switched"){
    $("providerStatus").textContent="El modelo local falló. Usando Ollama Cloud con tu autorización.";
   }else if(eventData.type==="completed"){
    completed=true;
    answer.textContent=eventData.reply;
    $("speechBubble").textContent="«"+eventData.reply+"»";
    sceneState?.act(eventData.animation||"talk");
    history.push({role:"user",content:text},{role:"assistant",content:eventData.reply});
    if(history.length>16)history.splice(0,history.length-16);
   }else if(eventData.type==="error"){
    throw new Error(eventData.error||"Error del profesor.");
   }
  }
  if(!completed&&!controller.signal.aborted)throw Error("La conversación terminó sin respuesta.");
 }catch(error){
  if(controller.signal.aborted){
   answer.textContent=partial?partial+" (interrumpido)":"(interrumpido)";
   return;
  }
  answer.classList.add("error");
  answer.textContent=error.message;
  $("speechBubble").textContent="¡Caramba! No consigo conectar con la IA.";
 }finally{
  if(turn===activeTurn){
   busy=false;activeController=null;
   $("sendButton").disabled=false;
   $("stopButton").disabled=true;
   $("sendButton").textContent="Preguntar al profesor";
  }
 }
}

try{localStorage.removeItem("daskalov_playerId");}catch{}
function applyDemoControls(){
 const demo=$("provider").value==="demo";
 if(demo){
  activeController?.abort();voice.cancel();
  $("remember").checked=false;$("remember").disabled=true;
  $("voiceEnabled").checked=false;$("voiceEnabled").disabled=true;voice.setEnabled(false);
  $("micButton").disabled=true;$("autoTurn").checked=false;
 }else{
  $("voiceEnabled").disabled=false;
  voice.setEnabled($("voiceEnabled").checked);
  $("micButton").disabled=!mic.available;
  memoryUI.refresh();
 }
 voice.setDemoMode(demo);
  $("demoNotice").hidden=!demo;
}
$("provider").addEventListener("change",()=>{
 writeSetting("provider",$("provider").value);
 applyDemoControls();
 settings.refreshModels();
});
$("model").addEventListener("change",()=>writeSetting("model",$("model").value));
$("stopButton").addEventListener("click",()=>{
 activeController?.abort();
 voice.cancel();
 sceneState?.clearSpeech?.();
 $("speechBubble").textContent="(El profesor ha sido interrumpido.)";
});
$("voiceEnabled").addEventListener("change",()=>{voice.setEnabled($("voiceEnabled").checked);voice.setEnabled($("voiceEnabled").checked);});
$("chatForm").addEventListener("submit",event=>{
 event.preventDefault();const text=$("question").value;$("question").value="";send(text);
});
memoryUI.bind();
const mic=configureVoiceInput({find:$,send,stopSpeech:()=>{activeController?.abort();voice.cancel();},showMessage});
gameUI=createGameUI({
 find:$,onGesture:gesture=>sceneState?.act(gesture),
 onCompleted:async lessonId=>{
  if(!$("remember").checked)return;
  try{
   await memoryUI.ensure();
   await fetch("/api/progress",{method:"POST",headers:{"content-type":"application/json","x-daskalov-csrf":memoryUI.csrfToken},body:JSON.stringify({lessonId,points:10})});
  }catch{}
 }
});
bindCameraKeyboard({
 getYaw:()=>yaw,
 setYaw:next=>{yaw=next;},
 onTurn:()=>{if($("autoTurn").checked)send("Me he girado a mirar a mis compañeros.","turned_around");}
});
settings.checkHealth();
settings.refreshModels();
memoryUI.refresh().then(applyDemoControls);
createClassroomScene({
 canvas:$("sceneCanvas"),status:$("sceneStatus"),getYaw:()=>yaw,isSpeaking:()=>playing,
 getReducedMotion:()=>$("reducedMotion").checked||window.matchMedia("(prefers-reduced-motion: reduce)").matches,
 quality:$("graphicsQuality").value,
 onReady:scene=>{sceneState=scene;}
});

if("serviceWorker" in navigator && (location.protocol==="https:"||["localhost","127.0.0.1"].includes(location.hostname))){
 navigator.serviceWorker.register("/sw.js").catch(()=>{});
}
