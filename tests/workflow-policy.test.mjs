import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

test("SEC-001: Cloud secret workflow never executes feature branches, PRs or untrusted events",()=>{
 const yaml=readFileSync(resolve(".github/workflows/ollama-real.yml"),"utf8");
 assert.match(yaml,/workflow_dispatch:/);
 assert.doesNotMatch(yaml,/^\s*(?:push|pull_request|pull_request_target|workflow_run|repository_dispatch|schedule):/m);
 assert.match(yaml,/github\.ref\s*==\s*'refs\/heads\/main'/);
 assert.match(yaml,/github\.event_name\s*==\s*'workflow_dispatch'/);
 assert.match(yaml,/environment:\s*daskalov-cloud-test/);
 assert.match(yaml,/timeout-minutes:\s*[1-4]/);
});
test("SEC-002: Cloud workflow uses least privilege and does not persist GitHub checkout token",()=>{
 const yaml=readFileSync(resolve(".github/workflows/ollama-real.yml"),"utf8");
 assert.match(yaml,/permissions:\s*\n\s*contents:\s*read/);
 assert.match(yaml,/persist-credentials:\s*false/);
 assert.doesNotMatch(yaml,/permissions:\s*write-all/);
});
test("SEC-003: ordinary PR CI does not reference secret values",()=>{
 const yaml=readFileSync(resolve(".github/workflows/ci.yml"),"utf8");
 assert.doesNotMatch(yaml,/secrets\.|OLLAMA_API_KEY/);
 assert.match(yaml,/pull_request:/);
});

test("SEC-002: all GitHub Actions are pinned to full commit SHAs",()=>{
 for(const name of ["ci.yml","ollama-real.yml","browser-e2e.yml","security.yml","performance.yml"]){
  const yaml=readFileSync(resolve(".github/workflows",name),"utf8");
  const lines=yaml.split("\n").filter(line=>/uses:\s+/.test(line));
  assert.ok(lines.length>=2,name+": workflows should use pinned actions");
  for(const line of lines){
   assert.match(line,/uses:\s+actions\/(?:checkout|setup-node|upload-artifact)@[a-f0-9]{40}(?:\s|$)/);
  }
  assert.match(yaml,/persist-credentials:\s*false/);
 }
});
test("SEC-003: secret references only in a trustworthy workflow",()=>{
 for(const name of ["ci.yml","ollama-real.yml"]){
  const yaml=readFileSync(resolve(".github/workflows",name),"utf8");
  if(yaml.includes("secrets.")){
   assert.equal(name,"ollama-real.yml");
   assert.doesNotMatch(yaml,/^\s*(?:pull_request|pull_request_target|push|workflow_run):/m);
   assert.match(yaml,/github\.ref\s*==\s*'refs\/heads\/main'/);
  }
 }
});

test("WEB-004: Browser E2E has no Cloud secret injection and runs on relevant changes",()=>{
 const browser=readFileSync(resolve(".github/workflows/browser-e2e.yml"),"utf8");
 assert.match(browser,/browser:\\s*\\[chromium,\\s*firefox\\]/);
 assert.match(browser,/fail-fast:\\s*false/);
 assert.match(browser,/--project=\\$\\{\\{ matrix\\.browser \\}\\}/);
 assert.match(browser,/name: daskalov-visual-review-\\$\\{\\{ matrix\\.browser \\}\\}/);
 assert.match(browser,/src\/\*\*/);
 assert.doesNotMatch(browser,/secrets\.|OLLAMA_API_KEY/);
 assert.match(browser,/persist-credentials:\s*false/);
});

test("REL-001: scheduled performance suite has no Cloud secrets or automatic merge",()=>{
 const workflow=readFileSync(resolve(".github/workflows/performance.yml"),"utf8");
 assert.match(workflow,/schedule:/);
 assert.match(workflow,/stress-100\.test\.mjs/);
 assert.match(workflow,/game-sessions\.test\.mjs/);
 assert.match(workflow,/persist-credentials:\s*false/);
 assert.doesNotMatch(workflow,/secrets\.|OLLAMA_API_KEY|pull_request_target|git push|merge pull/);
});

test("SEC-001: paid Cloud smoke cannot inherit conventional repository secret by accident",()=>{
 const yaml=readFileSync(resolve(".github/workflows/ollama-real.yml"),"utf8");
 assert.match(yaml,/confirm_paid_test:/);
 assert.match(yaml,/inputs\.confirm_paid_test == true/);
 assert.match(yaml,/secrets\.DASKALOV_ENV_OLLAMA_API_KEY/);
 assert.doesNotMatch(yaml,/secrets\.OLLAMA_API_KEY/);
 assert.match(yaml,/Missing approved Environment key/);
 assert.doesNotMatch(yaml,/^\s*(?:push|pull_request|pull_request_target|workflow_run|schedule):/m);
});
