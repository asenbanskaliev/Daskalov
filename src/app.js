import {streamTurn} from "./conversation.js";
import {BrowserSpeechQueue} from "./speech.js";
import {createClassroomScene} from "./scene.js";
import {bindCameraKeyboard} from "./camera-input.js";
import {$,showMessage} from "./dom-ui.js";
import {readSetting,writeSetting,createSettingsUI} from "./settings.js";
import {createMemoryUI} from "./memory-ui.js";
import {configureVoiceInput} from "./voice-input.js";

const history=[];
let busy=false,playing=false,yaw=0,sceneState=null,activeController=null,activeTurn=0;
const speech=new BrowserSpeechQueue({onSpeaking:active=>{playing=active;}});
const settings=createSettingsUI({find:$,showMessage});
const memoryUI=createMemoryUI({find:$,showMessage,history});
$("provider").value=readSetting("provider")||"cloud";
$("model").value=readSetting("model")||"beam";
async function send(text,event="dialog"){
 text=String(text).trim();
 if(!text)return;
 const provider=$("provider").value,model=$("model").value.trim();
 if(!model){showMessage("error","Selecciona un modelo.");return;}
 const remember=$("remember").checked;
 const turn=++activeTurn;
 activeController?.abort();
 speech.cancel();
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
  speech.setEnabled($("voiceEnabled").checked);
  for await(const eventData of streamTurn({
   body:{provider,model,text,event,remember,history:history.slice(-8)},
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
    speech.speak(eventData.text);
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
$("provider").addEventListener("change",()=>{
 writeSetting("provider",$("provider").value);
 settings.refreshModels();
});
$("model").addEventListener("change",()=>writeSetting("model",$("model").value));
$("stopButton").addEventListener("click",()=>{
 activeController?.abort();
 speech.cancel();
 $("speechBubble").textContent="(El profesor ha sido interrumpido.)";
});
$("voiceEnabled").addEventListener("change",()=>speech.setEnabled($("voiceEnabled").checked));
$("chatForm").addEventListener("submit",event=>{
 event.preventDefault();const text=$("question").value;$("question").value="";send(text);
});
memoryUI.bind();
configureVoiceInput({find:$,send,stopSpeech:()=>{activeController?.abort();speech.cancel();},showMessage});
bindCameraKeyboard({
 getYaw:()=>yaw,
 setYaw:next=>{yaw=next;},
 onTurn:()=>{if($("autoTurn").checked)send("Me he girado a mirar a mis compañeros.","turned_around");}
});
settings.checkHealth();
settings.refreshModels();
memoryUI.refresh();
createClassroomScene({
 canvas:$("sceneCanvas"),status:$("sceneStatus"),getYaw:()=>yaw,isSpeaking:()=>playing,
 getReducedMotion:()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,
 onReady:scene=>{sceneState=scene;}
});
