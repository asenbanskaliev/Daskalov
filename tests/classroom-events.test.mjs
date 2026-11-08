import test from "node:test";
import assert from "node:assert/strict";
import {ClassroomReactions,CLASSROOM_EVENTS} from "../src/classroom-events.js";
test("GAME-006: cinco eventos permitidos, sin spam ni humillación",()=>{
 assert.deepEqual(CLASSROOM_EVENTS,["cold","phone","silence","board","desk","talking"]);
 const engine=new ClassroomReactions({cooldownMs:1000});
 for(const name of CLASSROOM_EVENTS){
  const first=engine.react(name,1000);
  assert.ok(first.reply.length>20);
  assert.ok(!/eres un idiota|te voy a pegar/i.test(first.reply));
  assert.equal(engine.react(name,1500),null);
  assert.equal(engine.react(name,2000).event,name);
 }
 assert.equal(engine.react("inject_script",3000),null);
});

test("GAME-006: deterministic opt-in spontaneous events obey global 90-second cooldown",()=>{
 const engine=new ClassroomReactions({cooldownMs:1000,autoCooldownMs:90000});
 assert.equal(engine.auto(10,1000).event,"board");
 assert.equal(engine.auto(2,2000),null);
 assert.ok(engine.auto(2,91000));
 assert.equal(engine.auto(Number.NaN,190000),null);
 engine.reset();
 assert.ok(engine.auto(2,190000));
});
