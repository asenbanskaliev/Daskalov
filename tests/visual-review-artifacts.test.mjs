import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("WEB-007/GFX-009: visual review contains synthetic screenshots, no voice or private output",()=>{
 const action=readFileSync(".github/workflows/browser-e2e.yml","utf8");
 const captures=readFileSync("e2e/visual-regression.spec.js","utf8");
 const keyboard=readFileSync("e2e/keyboard-accessibility.spec.js","utf8");
 assert.match(action,/reports\/visual-review\//);
 assert.match(action,/retention-days: 7/);
 assert.match(action,/if: success\(\)/);
 assert.doesNotMatch(action,/secrets\.|OLLAMA_API_KEY|pull_request_target/);
 assert.match(captures,/testInfo\.project\.name/);
 assert.match(captures,/lessonPanel/);
 assert.match(keyboard,/SpeechRecognition/);
 assert.match(keyboard,/getByRole\("button"/);
 assert.match(keyboard,/lessonFeedback/);
});
