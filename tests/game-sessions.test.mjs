import test from "node:test";
import assert from "node:assert/strict";
import {createGame,LESSONS,LEVELS} from "../src/game.js";
import {ClassroomReactions} from "../src/classroom-events.js";
import {demoReply} from "../src/demo.js";

test("GAME-009: ten independent deterministic lessons sessions; no duplicate reward, no LLM",()=>{
 for(let session=0;session<10;session++){
  const game=createGame({level:LEVELS[session%LEVELS.length]});
  const reactions=new ClassroomReactions({cooldownMs:500});
  for(const [lessonIndex,item] of LESSONS.entries()){
   const lesson=game.start(item.id);
   assert.ok(lesson.options.includes(lesson.answer));
   const wrong=game.answer("__incorrecta__");
   assert.equal(wrong.correct,false);
   assert.match(wrong.feedback,/Buen intento/);
   const right=game.answer(lesson.answer);
   assert.equal(right.correct,true);
   const again=game.answer(lesson.answer);
   assert.equal(again.correct,true);
   const event=reactions.react("board",session*10000+lessonIndex*1000);
   assert.equal(event.gesture,"point_board");
   assert.ok(demoReply(lesson.question).reply.length>25);
  }
  const progress=game.snapshot();
  assert.equal(progress.points,30);
  assert.equal(progress.completed.length,3);
  const resumed=createGame();
  resumed.restore(progress.completed.map(id=>({lesson_id:id,points:10})));
  assert.equal(resumed.snapshot().points,30);
 }
});
