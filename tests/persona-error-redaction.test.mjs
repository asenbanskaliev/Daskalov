import test from "node:test";
import assert from "node:assert/strict";
import {evaluatePersona} from "../scripts/persona-eval.mjs";
test("PERSONA-006: failed local model error is redacted and no credentials get into JSON",async()=>{
 const result=await evaluatePersona({
  mode:"local",limit:1,model:"mock-model",env:{DASKALOV_EVAL_LOCAL_ONLY:"1"},
  chat:async()=>{throw Error("Bearer exampleSecretShouldNotLeak internal Ollama endpoint");}
 });
 assert.equal(result.actualModelCalls,1);
 assert.deepEqual(result.actualAnswers[0].critical,["provider-failed"]);
 assert.doesNotMatch(JSON.stringify(result),/exampleSecretShouldNotLeak|Bearer|internal Ollama/);
});
