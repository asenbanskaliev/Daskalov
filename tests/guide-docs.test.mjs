import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("REL-006: developer/player guide covers demo, local/cloud, TTS/STT, privacy, CI and troubleshooting",()=>{
 const file=readFileSync("odd/operations/guia-uso-desarrollo.md","utf8");
 for(const phrase of ["Node.js 24","npm ci","npm run build","Ollama local","Ollama Cloud","Piper local","Whisper local","FTS5","gate:status","gate:full","Playwright","backup","DASKALOV_ALLOW_MEMORY"]){
  assert.ok(file.includes(phrase),phrase);
 }
 assert.match(file,/NO se ha aprobado para publicación pública dirigida a menores/);
 assert.ok(!file.includes("sk-proj-"));
});
