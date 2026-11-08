import test from "node:test";
import assert from "node:assert/strict";
import {demoReply} from "../src/demo.js";
test("SEC-006: guion offline identificado y reacción del profesor",()=>{
 const math=demoReply("¿Cuántas tizas son tres menos una?");
 assert.match(math.reply,/matemáticas|tizas|ladrillos/i);
 assert.equal(math.animation,"point_board");
 const generic=demoReply("Preguntas no conocidas");
 assert.match(generic.reply,/demostración sin IA/i);
 assert.equal(demoReply("Hola",{event:"turned_around"}).animation,"ruler_desk");
});
test("SEC-006: demo no contiene acceso a red",()=>{
 const reply=demoReply("Hola");
 assert.ok(!JSON.stringify(reply).includes("/api/"));
});
