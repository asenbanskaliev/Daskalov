import test from "node:test";
import assert from "node:assert/strict";
import {LESSONS,LEVELS,lessonForLevel,createGame} from "../src/game.js";

/** Independent authored answer key (not derived from lessonForLevel). */
const KEY=Object.freeze({
 basic:{math:"2",language:"mesa",history:"Una carta antigua"},
 standard:{math:"5",language:"pizarra",history:"Una carta escrita en esa época"},
 advanced:{math:"4",language:"escribir",history:"Conocer autor y contexto"}
});
test("VAL-04: nine independently referenced canonical answers and unique distractors",()=>{
 assert.deepEqual(LEVELS,["basic","standard","advanced"]);
 assert.equal(LESSONS.length,3);
 for(const level of LEVELS){
  const game=createGame({level});
  for(const lesson of LESSONS){
   const expected=KEY[level][lesson.id];
   const actual=lessonForLevel(lesson.id,level);
   assert.equal(actual.answer,expected,level+":"+lesson.id);
   assert.equal(actual.options.filter(x=>x===expected).length,1);
   assert.equal(new Set(actual.options).size,actual.options.length);
   assert.ok(actual.question.length>=18,level+":"+lesson.id+" question");
   assert.ok(actual.explanation.length>=18,level+":"+lesson.id+" explanation");
   game.start(lesson.id);
   const incorrect=actual.options.find(x=>x!==expected);
   const wrong=game.answer(incorrect);
   assert.equal(wrong.correct,false);
   assert.match(wrong.feedback,/Buen intento/);
   const right=game.answer(expected);
   assert.equal(right.correct,true);
   assert.match(right.feedback,/Muy bien/);
   assert.equal(game.answer(expected).correct,true);
  }
  assert.equal(game.snapshot().completed.length,3);
  assert.equal(game.snapshot().points,30);
 }
});
