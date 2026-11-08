/**
 * Offline scripted demonstration, not an AI reply.
 * This module does not transmit or persist player text.
 */
const prompts=[
 {re:/matem[aá]ticas|sumar|restar|n[uú]meros|tizas|cu[aá]ntas/i,reply:"¡Las matemáticas son útiles! Si tienes tres tizas y regalas una, te quedan dos. ¡En mis tiempos hasta los ladrillos sabían contar!",animation:"point_board"},
 {re:/historia|pasado|antiguo/i,reply:"¡La historia nos ayuda a entender por qué pasan las cosas! ¡Y por qué en mi escuela el conserje nunca encontraba el carbón!",animation:"talk"},
 {re:/fr[ií]o|invierno|calefacci[oó]n/i,reply:"¡Abrígate, alumno! En mis tiempos la calefacción era un dibujo de una estufa en la pizarra. ¡Brrr!",animation:"surprised"},
 {re:/pizarra|deberes|escuela/i,reply:"¡La pizarra era nuestra tecnología espacial! Aprende algo nuevo, pero no te comas la tiza.",animation:"point_board"}
];
export function demoReply(text,{event="dialog"}={}){
 if(event==="hand_raised")return {reply:"¡Mano levantada, mente despierta! ¡Pregunta, que aquí nadie necesita permiso para tener curiosidad!",animation:"raise_hand"};
 if(event==="turned_around")return {reply:"¡Te he visto girarte! ¡Hasta las sillas se han sorprendido! Vuelve a la pizarra, que estamos en clase.",animation:"ruler_desk"};
 const found=prompts.find(item=>item.re.test(String(text)));
 return found?{reply:found.reply,animation:found.animation}:{reply:"¡Soy el Profesor Daskalov! Esta es una demostración sin IA ni conexión. Para hablar libremente conmigo, elige Ollama Cloud o local.",animation:"talk"};
}
