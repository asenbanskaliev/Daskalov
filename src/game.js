/**
 * Deterministic local lessons. No LLM necessary; no tracking, profiles or storage.
 * Curriculum is a starting point for review by teachers, not a certified curriculum.
 */
export const LESSONS=Object.freeze([
 {id:"math",title:"Matemáticas",objective:"Sumar cantidades sencillas",question:"Tienes tres tizas y el profesor trae dos más. ¿Cuántas tizas hay?",options:["4","5","6"],answer:"5",hint:"Empieza con tres; cuenta dos pasos más: cuatro, cinco.",explanation:"3 + 2 = 5 tizas. ¡Ni una se ha escapado del bolsillo!",icon:"∑"},
 {id:"language",title:"Lengua",objective:"Identificar sustantivos",question:"¿Cuál de estas palabras es un sustantivo?",options:["rápido","pizarra","saltar"],answer:"pizarra",hint:"Busca la palabra que nombra un objeto del aula.",explanation:"Pizarra es un sustantivo porque nombra un objeto; rápido es adjetivo y saltar es verbo.",icon:"Aa"},
 {id:"history",title:"Historia",objective:"Distinguir fuentes históricas",question:"¿Qué es una fuente primaria para estudiar la historia?",options:["Una carta escrita en esa época","Una película de ficción actual","Una opinión sin pruebas"],answer:"Una carta escrita en esa época",hint:"Una fuente primaria se creó en el periodo que investigamos.",explanation:"Una carta escrita en la época estudiada es una fuente primaria. Su contexto también importa.",icon:"⌛"}
]);
const byId=new Map(LESSONS.map(x=>[x.id,x]));
export function createGame({onChange=()=>{}}={}){
 let current=null;
 const completed=new Set();
 const mistakes=new Map();
 function snapshot(){return {current,completed:[...completed],points:completed.size*10,total:LESSONS.length,mistakes:Object.fromEntries(mistakes)};}
 function start(id){
  const lesson=byId.get(id);
  if(!lesson)throw Error("Lección inexistente.");
  current=id;
  onChange(snapshot());
  return lesson;
 }
 function answer(input){
  const lesson=byId.get(current);
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
 return {start,answer,snapshot,restore,get lesson(){return byId.get(current)||null;}};
}
