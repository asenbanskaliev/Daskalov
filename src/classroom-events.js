const SCENARIOS=Object.freeze({
 cold:{reply:"¡Brrr! En mis tiempos la calefacción era un dibujo de una chimenea. Abrigaos bien y sigamos aprendiendo.",gesture:"surprised"},
 phone:{reply:"¡Ese teléfono está más nervioso que el conserje Petar en el examen de historia! Siléncialo y continuamos.",gesture:"talk"},
 silence:{reply:"Clase silenciosa... ¡Milagro! ¿Alguien quiere participar? No pasa nada si necesitas pensar.",gesture:"talk"},
 board:{reply:"¡A la pizarra! Aquí los errores se corrigen y nadie tiene que avergonzarse.",gesture:"point_board"},
 desk:{reply:"¡Atención! La regla golpea la mesa, no al alumnado. ¡PUM teatral y seguimos!",gesture:"ruler_desk"}
});
export const CLASSROOM_EVENTS=Object.freeze(Object.keys(SCENARIOS));
export class ClassroomReactions{
 constructor({cooldownMs=18000}={}){this.cooldownMs=cooldownMs;this.history=new Map();}
 react(event,now=Date.now()){
  if(!Object.hasOwn(SCENARIOS,event))return null;
  const last=this.history.get(event)??-Infinity;
  if(now-last<this.cooldownMs)return null;
  this.history.set(event,now);
  return {...SCENARIOS[event],event};
 }
 reset(){this.history.clear();}
}
