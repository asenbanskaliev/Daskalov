import {TurnTrigger} from "./events.js";
export function nextYaw(yaw,key,step=0.22){
 const delta=key==="ArrowLeft"?step:key==="ArrowRight"?-step:0;
 return Math.max(-1.4,Math.min(1.4,yaw+delta));
}
export function bindCameraKeyboard({getYaw,setYaw,onTurn,target=window}){
 const trigger=new TurnTrigger();
 const listener=event=>{
  const element=event.target;
  if(element?.matches?.("input,select,textarea,[contenteditable]"))return;
  if(event.key==="Home"){setYaw(0);return;}
  if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
  event.preventDefault();
  const updated=nextYaw(getYaw(),event.key);
  setYaw(updated);
  if(trigger.update(updated))onTurn?.();
 };
 target.addEventListener("keydown",listener);
 return ()=>target.removeEventListener("keydown",listener);
}
