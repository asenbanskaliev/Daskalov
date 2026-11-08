import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("PERSONA-300: paid evaluation is manual, main-only, environment-reviewed and only aggregates",()=>{
 const file=readFileSync(".github/workflows/nvidia-persona-real.yml","utf8");
 assert.match(file,/workflow_dispatch:/);
 assert.match(file,/github\.ref == 'refs\/heads\/main'/);
 assert.match(file,/inputs\.confirm_paid_test == true/);
 assert.match(file,/environment: daskalov-cloud-test/);
 assert.match(file,/secrets\.DASKALOV_ENV_NVIDIA_API_KEY/);
 assert.doesNotMatch(file,/secrets\.NVIDIA_API_KEY/);
 assert.match(file,/DASKALOV_REMOTE_EVAL_CONSENT: "1"/);
 assert.match(file,/options:\s*\n\s+- "20"\s*\n\s+- "300"/);
 assert.match(file,/path: reports\/remote-persona-live.json/);
 assert.doesNotMatch(file,/^\s*(push|pull_request|pull_request_target|schedule|workflow_run):/m);
 assert.match(file,/persist-credentials: false/);
});
