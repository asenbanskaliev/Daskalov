import {ClassroomReactions} from "./classroom-events.js";
export function configureClassroomEvents({find,onVoiceCancel=()=>{},onGesture=()=>{},onVoice=()=>{}}){
 const classroom=new ClassroomReactions();
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
