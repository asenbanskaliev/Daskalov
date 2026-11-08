import {ClassroomReactions} from "./classroom-events.js";
export function configureClassroomEvents({find,onVoiceCancel=()=>{},onGesture=()=>{},onVoice=()=>{}}){
 const classroom=new ClassroomReactions();
 const show=response=>{
  show(response);
 };
 // Disabled by default; the checkbox is a direct, informed player opt-in.
 const randomInterval=setInterval(()=>{
  if(!find("classroomAutoEvents").checked||document.hidden)return;
  const response=classroom.auto(Date.now(),Date.now());
  if(response)show(response);
 },15000);
 window.addEventListener("pagehide",()=>clearInterval(randomInterval),{once:true});
  find("classroomEvents").addEventListener("click",event=>{
  const button=event.target.closest("button[data-classroom-event]");
  if(!button)return;
  const response=classroom.react(button.dataset.classroomEvent);
  if(!response){find("classroomFeedback").textContent="Espera un momento antes de repetir ese evento.";return;}
  onVoiceCancel();
  find("classroomFeedback").textContent=response.reply;
  find("speechBubble").textContent="«"+response.reply+"»";
  onGesture(response.gesture);
  onVoice(response.reply);
 });
 return classroom;
}
