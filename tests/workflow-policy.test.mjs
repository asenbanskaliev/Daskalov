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
