import test from "node:test";
import assert from "node:assert/strict";
import {splitSpeechSegments} from "../server/stream.mjs";
test("VAL-02: only moderated complete sentences are divided into valid Piper phrases",()=>{
 const full="Podemos repasar historia con calma y practicar en la pizarra. ".repeat(8);
 const pieces=splitSpeechSegments(full);
 assert.ok(pieces.length>2);
 assert.ok(pieces.every(piece=>piece.length>0&&piece.length<=160));
 assert.equal(pieces.join(" "),full.trim().replace(/\s+/g," "));
 assert.deepEqual(splitSpeechSegments(""),[]);
 assert.throws(()=>splitSpeechSegments("Hola",161),/Límite/);
});
