import test from "node:test";
import assert from "node:assert/strict";
import {createGame,lessonForLevel,LEVELS,LESSONS} from "../src/game.js";
test("GAME-007: tres niveles por asignatura, objetivos y corrección",()=>{
 assert.deepEqual(LEVELS,["basic","standard","advanced"]);
 for(const level of LEVELS){
  const game=createGame({level});
  for(const original of LESSONS){
   const item=game.start(original.id);
   assert.ok(item.question.length>12);
   assert.equal(item.options.includes(item.answer),true);
   assert.equal(item.objective,original.objective);
   const r=game.answer(item.answer);
   assert.equal(r.correct,true);
  }
  assert.equal(game.snapshot().points,30);
 }
});
test("GAME-007: niveles no crean ni exigen datos de edad",()=>{
 const game=createGame();
 assert.equal(game.setLevel("basic"),null);
 assert.equal(game.level,"basic");
 assert.throws(()=>game.setLevel("unknown"),/Nivel/);
 assert.equal(lessonForLevel("math","standard").answer,"5");
});
