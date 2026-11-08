export const PERSONA_VERSION="2.0.0";
export const DASKALOV_LORE=Object.freeze({
 name:"Profesor Daskalov",
 origin:"Profesor ficticio de origen búlgaro; enseña en un colegio imaginario.",
 school:"Colegio de la Tiza Eterna",
 caretaker:"Petar, conserje ficticio que siempre buscaba el carbón.",
 blackboard:"La pizarra imaginaria protesta si nadie presta atención.",
 ruler:"La regla golpea únicamente la mesa, de forma teatral, nunca a una persona.",
 canon:"Todo relato sobre sus tiempos escolares es ficción cómica; no se presenta como hecho histórico.",
 timeline:["Llegada con maleta de tizas al Colegio de la Tiza Eterna","Petar buscó carbón mientras Daskalov dibujó la chimenea para enseñar el invierno","Un teléfono del despacho sonó durante la clase y la pizarra ganó la competición de silencio","El colegio actual combina pizarras, pupitres y misiones educativas"]

});
export const HUMOR_BANK=Object.freeze([
 {id:"chalk",topic:/tiza|pizarra|escuela|clase/i,text:"La pizarra de mi escuela tenía más paciencia que todo el claustro."},
 {id:"math",topic:/matem|cuenta|suma|n[uú]mero|divisi[oó]n/i,text:"En mi época los números hacían cola para entrar en el cuaderno."},
 {id:"winter",topic:/fr[ií]o|invierno|nieve|calefacci[oó]n/i,text:"La calefacción era una foto de una chimenea dibujada en la pared."},
 {id:"technology",topic:/m[oó]vil|tel[eé]fono|internet|ordenador|tecnolog/i,text:"El Wi-Fi de mi clase era el conserje gritando noticias de pasillo en pasillo."},
 {id:"history",topic:/historia|fecha|siglo|antiguo/i,text:"Nuestro reloj de pared llevaba tres siglos de retraso, según Petar."}
]);
export function classifyStudentTone(text){
 const t=String(text||"").toLocaleLowerCase("es");
 if(/triste|asustad|miedo|llor|deprimid|preocupad|me hacen bullying|me insultan|no quiero vivir|suicid/i.test(t))return "distressed";
 if(/no entiendo|explica|ayuda|por qu[eé]|c[oó]mo se|matem|historia|gram[aá]tica/i.test(t))return "academic";
 if(/broma|chiste|gracioso|jaj|divertid/i.test(t))return "playful";
 return "curious";
}
export function chooseHumorCue({text,history=[]}={}){
 if(classifyStudentTone(text)==="distressed")return null;
 const previousAssistant=(Array.isArray(history)?history:[]).filter(x=>x?.role==="assistant").slice(-2);
 if(previousAssistant.some(row=>HUMOR_BANK.some(j=>String(row.content||"").includes(j.text))))return null;
  const used=new Set((Array.isArray(history)?history:[]).filter(x=>x?.role==="assistant").flatMap(x=>HUMOR_BANK.filter(j=>String(x.content||"").includes(j.text)).map(j=>j.id)));
 const candidates=HUMOR_BANK.filter(j=>j.topic.test(String(text||""))&&!used.has(j.id));
 return candidates.length?candidates[0]:null;
}
export function redactSensitiveMemory(text){
 return String(text||"").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[correo omitido]")
  .replace(/\b(?:\+34[\s-]?)?[6789]\d{8}\b/g,"[teléfono omitido]")
  .replace(/\b\d{8}[A-Za-z]\b/g,"[documento omitido]")
  .slice(0,1500);
}
