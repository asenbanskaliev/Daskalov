import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("REL-004: Docker demo is unprivileged, no secrets and CI proves API disabled",()=>{
 const docker=readFileSync("Dockerfile","utf8");
 const workflow=readFileSync(".github/workflows/container-demo.yml","utf8");
 const proxy=readFileSync("Caddyfile.example","utf8");
 assert.match(docker,/FROM node:24-alpine/);
 assert.match(docker,/DASKALOV_SAFE_DEMO_ONLY=1/);
 assert.match(docker,/USER node/);
 assert.match(docker,/HEALTHCHECK/);
 assert.doesNotMatch(docker,/OLLAMA_API_KEY|DASKALOV_ALLOW_MEMORY=1/);
 assert.match(workflow,/docker build/);
 assert.match(workflow,/"demoOnly":true/);
 assert.match(workflow,/test "\$status" = "403"/);
 assert.match(workflow,/persist-credentials:\s*false/);
 assert.doesNotMatch(workflow,/secrets\.|OLLAMA_API_KEY|pull_request_target/);
 assert.match(proxy,/reverse_proxy daskalov:3000/);
});

test("REL-005: actual Docker job checks deployed SHA and demo isolation with post-deploy smoke",()=>{
 const workflow=readFileSync(".github/workflows/container-demo.yml","utf8");
 assert.match(workflow,/DASKALOV_RELEASE_SHA="\$GITHUB_SHA"/);
 assert.match(workflow,/DASKALOV_SMOKE_EXPECTED_SHA="\$GITHUB_SHA"/);
 assert.match(workflow,/DASKALOV_SMOKE_EXPECT_DEMO=1/);
 assert.match(workflow,/node scripts\/post-deploy-smoke\.mjs/);
 assert.match(workflow,/node-version: "24"/);
 assert.doesNotMatch(workflow,/secrets\.|OLLAMA_API_KEY|pull_request_target/);
});
