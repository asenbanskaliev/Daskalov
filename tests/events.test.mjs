import test from "node:test";
import assert from "node:assert/strict";
import {TurnTrigger} from "../public/events.js";
test("el giro de cámara solo causa un evento por ciclo, con cooldown",()=>{
 const t=new TurnTrigger({threshold:.8,cooldownMs:2000});
 assert.equal(t.update(.3,0),false);assert.equal(t.update(.9,100),true);assert.equal(t.update(1.1,200),false);
 assert.equal(t.update(0,250),false);assert.equal(t.update(-.9,300),false);
 assert.equal(t.update(0,3000),false);assert.equal(t.update(-.9,3100),true);
});
