import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("SEC-008: operating policy includes user deletion, privacy, accessibility, breach and no-go rules",()=>{
 const s=readFileSync("odd/security/use-privacy-incident-policy.md","utf8");
 for(const term of ["supresión","accesibilidad","incidente","revocar claves","menores","backups","Cloud","Whisper","Piper","releases","no se activan por defecto"]){
  assert.ok(s.toLocaleLowerCase("es").includes(term.toLocaleLowerCase("es")),term);
 }
 assert.match(s,/No desplegar como plataforma para menores/);
});
