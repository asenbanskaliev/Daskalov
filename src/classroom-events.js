const SCENARIOS=Object.freeze({
 cold:{reply:"¡Brrr! En mis tiempos la calefacción era un dibujo de una chimenea. Abrigaos bien y sigamos aprendiendo.",gesture:"surprised"},
 phone:{reply:"¡Ese teléfono está más nervioso que el conserje Petar en el examen de historia! Siléncialo y continuamos.",gesture:"talk"},
 silence:{reply:"Clase silenciosa... ¡Milagro! ¿Alguien quiere participar? No pasa nada si necesitas pensar.",gesture:"talk"},
 board:{reply:"¡A la pizarra! Aquí los errores se corrigen y nadie tiene que avergonzarse.",gesture:"point_board"},
 talking:{reply:"¡Veo conversaciones por los pupitres! Seguro que la pizarra quiere participar también. Turno de escuchar.",gesture:"talk"},
 desk:{reply:"¡Atención! La regla golpea la mesa, no al alumnado. ¡PUM teatral y seguimos!",gesture:"ruler_desk"}
});
export const CLASSROOM_EVENTS=Object.freeze(Object.keys(SCENARIOS));
export class ClassroomReactions{
 constructor({cooldownMs=18000,autoCooldownMs=90000}={}){this.cooldownMs=cooldownMs;this.autoCooldownMs=autoCooldownMs;this.lastAuto=-Infinity;this.history=new Map();}
 react(event,now=Date.now()){
  if(!Object.hasOwn(SCENARIOS,event))return null;
  const last=this.history.get(event)??-Infinity;
  if(now-last<this.cooldownMs)return null;
  this.history.set(event,now);
  return {...SCENARIOS[event],event};
 }
 auto(seed,now=Date.now()){
  if(now-this.lastAuto<this.autoCooldownMs)return null;
  if(!Number.isFinite(seed))return null;
  const index=Math.abs(Math.floor(seed))%CLASSROOM_EVENTS.length;
  const selected=CLASSROOM_EVENTS[index];
  const result=this.react(selected,now);
  if(result)this.lastAuto=now;
  return result;
 }
 reset(){this.history.clear();this.lastAuto=-Infinity;}
}
