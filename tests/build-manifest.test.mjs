import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("REL-003: manifest del build usa SHA-256 y no lee claves",()=>{
 const code=readFileSync("scripts/build-manifest.mjs","utf8");
 assert.match(code,/sha256/);
 assert.match(code,/manifest\.json/);
 assert.doesNotMatch(code,/OLLAMA_API_KEY|process\.env/);
});
test("SAFE-006: SBOM se obtiene del lockfile sin ejecutar comandos remotos",()=>{
 const code=readFileSync("scripts/sbom.mjs","utf8");
 assert.match(code,/package-lock\.json/);
 assert.doesNotMatch(code,/child_process|eval\(|exec\(/);
});
