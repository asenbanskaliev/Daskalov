/** Audio-driven speaking animation only overrides idle; higher priority classroom gestures remain. */
export function gestureForAudio(gesture,speaking){
 return speaking&&gesture==="idle"?"talk":gesture;
}
