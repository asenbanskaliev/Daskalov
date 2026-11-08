import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("REL-002: Chrome and Edge smoke isolated from production secrets",()=>{
 const action=readFileSync(".github/workflows/browser-brands.yml","utf8");
 const config=readFileSync("playwright.brands.config.mjs","utf8");
 const smoke=readFileSync("e2e/brand-smoke.spec.js","utf8");
 assert.match(action,/playwright install --with-deps chrome msedge/);
 assert.match(action,/persist-credentials:\s*false/);
 assert.doesNotMatch(action,/secrets\.|OLLAMA_API_KEY|pull_request_target/);
 assert.match(config,/channel:"chrome"/);
 assert.match(config,/channel:"msedge"/);
 assert.match(smoke,/provider"\)\.selectOption\("demo"\)/);
});
