import test from "node:test";
import assert from "node:assert/strict";
import {ClassroomReactions,CLASSROOM_EVENTS} from "../src/classroom-events.js";
test("GAME-006: cinco eventos permitidos, sin spam ni humillación",()=>{
 assert.deepEqual(CLASSROOM_EVENTS,["cold","phone","silence","board","desk"]);
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
