import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
test("REL-008: no GitHub workflow can auto merge, push to main or deploy from editable branch",()=>{
 const dir=".github/workflows";
 for(const path of readdirSync(dir).filter(s=>s.endsWith(".yml")||s.endsWith(".yaml"))){
  const y=readFileSync(dir+"/"+path,"utf8");
  assert.doesNotMatch(y,/pull_request_target:|git\s+push|gh\s+pr\s+merge|merge_pull_request|auto-merge/i,path);
 }
 const policy=readFileSync("odd/quality/full-release-gate.md","utf8");
 assert.match(policy,/no realiza merge/i);
 assert.match(policy,/revisión externa firmada/i);
});
