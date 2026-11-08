import test from "node:test";
import assert from "node:assert/strict";
import {createGame,LESSONS} from "../src/game.js";
test("GAME-001/002: tres asignaturas con objetivos, feedback y pistas graduadas",()=>{
 assert.deepEqual(LESSONS.map(x=>x.id),["math","language","history"]);
 const game=createGame();
 for(const lesson of LESSONS){
  const init=game.start(lesson.id);
  assert.ok(init.question.length>5);
  const wrong=game.answer("__wrong__");
  assert.equal(wrong.correct,false);
  assert.ok(wrong.hint.length>3);
  const correct=game.answer(lesson.answer);
  assert.equal(correct.correct,true);
  assert.equal(game.snapshot().completed.includes(lesson.id),true);
 }
 assert.equal(game.snapshot().completed.length,3);
});
test("GAME-005: errores no humillan, repetición no da doble recompensa",()=>{
 const game=createGame();game.start("math");
 const error=game.answer("incorrecta");
 assert.ok(!/tonto|burro|castigo|inútil/i.test(error.feedback));
 game.answer(LESSONS[0].answer);
 game.start("math");game.answer(LESSONS[0].answer);
 assert.equal(game.snapshot().points,10);
});

test("GAME-003: progreso autorizado se reanuda sin duplicar puntos",()=>{
 const old=createGame();old.start("math");old.answer("5");
 const newGame=createGame();
 newGame.restore([{lesson_id:"math",points:10},{lesson_id:"math",points:10},{lesson_id:"injected",points:10}]);
 assert.equal(newGame.snapshot().points,10);
 newGame.start("math");newGame.answer("5");
 assert.equal(newGame.snapshot().points,10);
});
