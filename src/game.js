/**
 * Deterministic local lessons. No LLM necessary; no tracking, profiles or storage.
 * Curriculum is a starting point for review by teachers, not a certified curriculum.
 */
export const LESSONS=Object.freeze([
 {id:"math",title:"Matemáticas",objective:"Sumar cantidades sencillas",question:"Tienes tres tizas y el profesor trae dos más. ¿Cuántas tizas hay?",options:["4","5","6"],answer:"5",hint:"Empieza con tres; cuenta dos pasos más: cuatro, cinco.",explanation:"3 + 2 = 5 tizas. ¡Ni una se ha escapado del bolsillo!",icon:"∑"},
 {id:"language",title:"Lengua",objective:"Identificar sustantivos",question:"¿Cuál de estas palabras es un sustantivo?",options:["rápido","pizarra","saltar"],answer:"pizarra",hint:"Busca la palabra que nombra un objeto del aula.",explanation:"Pizarra es un sustantivo porque nombra un objeto; rápido es adjetivo y saltar es verbo.",icon:"Aa"},
 {id:"history",title:"Historia",objective:"Distinguir fuentes históricas",question:"¿Qué es una fuente primaria para estudiar la historia?",options:["Una carta escrita en esa época","Una película de ficción actual","Una opinión sin pruebas"],answer:"Una carta escrita en esa época",hint:"Una fuente primaria se creó en el periodo que investigamos.",explanation:"Una carta escrita en la época estudiada es una fuente primaria. Su contexto también importa.",icon:"⌛"}
]);
export const LEVELS=Object.freeze(["basic","standard","advanced"]);
const VARIANTS=Object.freeze({
 basic:{
  math:{question:"Tienes una tiza y te regalan otra. ¿Cuántas tienes?",options:["1","2","3"],answer:"2",hint:"Empieza con una y añade otra.",explanation:"1 + 1 = 2 tizas."},
  language:{question:"¿Cuál es el nombre de un objeto?",options:["mesa","correr","alegre"],answer:"mesa",hint:"Un sustantivo nombra una cosa.",explanation:"Mesa nombra un objeto; es un sustantivo."},
  history:{question:"¿Cuál de estas cosas puede ayudarnos a estudiar el pasado?",options:["Una carta antigua","Un dibujo inventado hoy","Una adivinanza sin fecha"],answer:"Una carta antigua",hint:"Busca un objeto hecho en el pasado.",explanation:"Una carta antigua es una fuente histórica."}
 },
 advanced:{
  math:{question:"Si tenemos 6 tizas y prestamos 2 a otra clase, ¿cuántas quedan?",options:["3","4","5"],answer:"4",hint:"Restar significa quitar: 6 menos 2.",explanation:"6 - 2 = 4 tizas."},
  language:{question:"¿Qué palabra es un verbo en infinitivo?",options:["escribir","rápido","aula"],answer:"escribir",hint:"Un verbo expresa una acción.",explanation:"Escribir es un verbo en infinitivo."},
  history:{question:"¿Qué decisión ayuda a evaluar la fiabilidad de una fuente histórica?",options:["Conocer autor y contexto","Creer cualquier relato","Ignorar la fecha"],answer:"Conocer autor y contexto",hint:"Comprueba quién la creó y en qué momento.",explanation:"Conocer autor y contexto ayuda a interpretar críticamente una fuente."}
 }
});
const byId=new Map(LESSONS.map(x=>[x.id,x]));
export function lessonForLevel(id,level="standard"){
 const lesson=byId.get(id);
 if(!lesson)throw Error("Lección inexistente.");
 const selected=LEVELS.includes(level)?level:"standard";
 return {...lesson,...(VARIANTS[selected]?.[id]||{})};
}
export function createGame({onChange=()=>{},level="standard"}={}){
 let current=null,activeLesson=null,currentLevel=LEVELS.includes(level)?level:"standard";
 const completed=new Set();
 const mistakes=new Map();
 function snapshot(){return {current,completed:[...completed],points:completed.size*10,total:LESSONS.length,mistakes:Object.fromEntries(mistakes)};}
 function start(id){
  const lesson=lessonForLevel(id,currentLevel);
  current=id;activeLesson=lesson;
  onChange(snapshot());
  return lesson;
 }
 function answer(input){
  const lesson=activeLesson;
  if(!lesson)throw Error("Primero selecciona una lección.");
  const correct=String(input).trim().toLocaleLowerCase("es")===lesson.answer.toLocaleLowerCase("es");
  if(correct){completed.add(current);onChange(snapshot());return {correct:true,feedback:"¡Muy bien! "+lesson.explanation,hint:"",completed:true};}
  mistakes.set(current,(mistakes.get(current)||0)+1);
  const hint=(mistakes.get(current)||0)>1?lesson.hint+" Recuerda: "+lesson.objective+".":lesson.hint;
  onChange(snapshot());
  return {correct:false,feedback:"Buen intento. Puedes probar otra vez; no pasa nada por equivocarse.",hint,completed:false};
 }
 function restore(items){
  if(!Array.isArray(items))return snapshot();
  for(const row of items.slice(0,LESSONS.length)){
   if(byId.has(row.lesson_id)&&row.points===10)completed.add(row.lesson_id);
  }
  onChange(snapshot());
  return snapshot();
 }
 return {
  start,answer,snapshot,restore,
  setLevel(value){
   if(!LEVELS.includes(value))throw Error("Nivel no reconocido.");
   currentLevel=value;
   if(current)activeLesson=lessonForLevel(current,currentLevel);
   return activeLesson;
  },
  get level(){return currentLevel;},
  get lesson(){return activeLesson;}
 };
}
