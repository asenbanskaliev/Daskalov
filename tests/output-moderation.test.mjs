import test from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {moderateProfessorOutput} from "../server/output-moderation.mjs";
import {createApp} from "../server/main.mjs";
test("CHAR-005: unsafe fictional teacher reply is replaced before deltas, TTS and persistence",async t=>{
 const harmful="Eres un inútil, te voy a pegar.";
 const app=createApp({dbPath:":memory:",streamLlm:async function*(){yield "Eres un inútil, ";yield "te voy a pegar.";}});
 app.server.listen(0,"127.0.0.1");await once(app.server,"listening");
 t.after(async()=>{await new Promise(done=>app.server.close(done));app.close();});
 const base="http://127.0.0.1:"+app.server.address().port;
 const response=await fetch(base+"/api/chat/stream",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"local",model:"qwen:7b",text:"Hola"})});
 const lines=(await response.text()).trim().split("\n").map(JSON.parse);
 assert.equal(lines.at(-1).type,"completed");
 assert.ok(lines.some(x=>x.type==="sentence"));
 assert.ok(lines.some(x=>x.type==="delta"));
 assert.ok(!JSON.stringify(lines).includes("inútil"));
 assert.ok(!JSON.stringify(lines).includes("pegar"));
 assert.match(lines.at(-1).reply,/respeto/);
});
test("CHAR-005: direct response and personal identifiers are sanitized",()=>{
 assert.equal(moderateProfessorOutput("Te voy a golpear.").blocked,true);
 const result=moderateProfessorOutput("Envíame un correo a alumno@example.com.");
 assert.ok(result.text.includes("omitido"));
 assert.ok(!result.text.includes("alumno@example.com"));
 assert.equal(moderateProfessorOutput("La pizarra es verde.").blocked,false);
});
