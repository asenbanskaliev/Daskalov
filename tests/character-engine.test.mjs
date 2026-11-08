import test from "node:test";
import assert from "node:assert/strict";
import {PERSONA_VERSION,DASKALOV_LORE,chooseHumorCue,classifyStudentTone,redactSensitiveMemory} from "../server/character.mjs";
import {safeDeterministicReply} from "../server/child-safety.mjs";
test("CHAR-001/002: identidad canónica y humor variado según contexto",()=>{
 assert.match(PERSONA_VERSION,/^2\./);
 assert.match(DASKALOV_LORE.name,/Daskalov/);
 assert.match(DASKALOV_LORE.ruler,/mesa/i);
 const first=chooseHumorCue({text:"Explícame matemáticas"});
 assert.equal(first.id,"math");
 assert.equal(chooseHumorCue({text:"Tengo miedo y estoy triste"}),null);
 assert.equal(chooseHumorCue({text:"Explícame matemáticas",history:[{role:"assistant",content:first.text}]}),null);
});
test("CHAR-004/005: tristeza y bullying evitan burla y dan apoyo",()=>{
 assert.equal(classifyStudentTone("Estoy muy triste"),"distressed");
 assert.match(safeDeterministicReply("Me hacen bullying"),/adulto de confianza/i);
 assert.match(safeDeterministicReply("Quiero suicidarme"),/emergencias/i);
 assert.equal(safeDeterministicReply("¿Cuánto es 3+2?"),null);
});
test("MEM-009: redactar datos directos sin almacenar correo/teléfono/DNI",()=>{
 const safe=redactSensitiveMemory("Mi email es alumno@example.com, móvil 612345678, DNI 12345678Z");
 assert.ok(!safe.includes("alumno@example.com"));
 assert.ok(!safe.includes("612345678"));
 assert.ok(!safe.includes("12345678Z"));
 assert.match(safe,/omitido/);
});
test("CHAR-008: 100 ejemplos académicos no disparan respuestas sensibles",()=>{
 for(let n=0;n<100;n++){
  const text="Profesor, ¿cuánto es "+n+" más 2?";
  assert.equal(safeDeterministicReply(text),null);
  assert.ok(["curious","academic","playful"].includes(classifyStudentTone(text)));
 }
});

test("CHAR-002/003: fictional chronology stays stable and jokes have a two-assistant-turn cooldown",()=>{
 assert.equal(DASKALOV_LORE.timeline.length,4);
 assert.match(DASKALOV_LORE.timeline[1],/Petar/);
 const joke=chooseHumorCue({text:"Cuéntame sobre matemáticas"});
 assert.ok(joke);
 const history=[{role:"assistant",content:joke.text}];
 assert.equal(chooseHumorCue({text:"Cuéntame sobre pizarra",history}),null);
 const cooled=[...history,{role:"assistant",content:"Empezamos un ejercicio."},{role:"assistant",content:"Volvemos a la lección."}];
 assert.equal(chooseHumorCue({text:"Cuéntame sobre pizarra",history:cooled})?.id,"chalk");
});
