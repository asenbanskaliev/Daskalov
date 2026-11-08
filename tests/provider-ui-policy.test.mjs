import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("AI-011: password key is scoped to tab, provider-specific, never stored in localStorage",()=>{
 const src=readFileSync("src/provider-credentials.js","utf8");
 const html=readFileSync("index.html","utf8");
 const conf=readFileSync("src/settings.js","utf8");
 const turn=readFileSync("src/conversation.js","utf8");
 assert.match(html,/id="providerApiKey" type="password"/);
 assert.match(html,/value="openrouter"/);
 assert.match(html,/value="nvidia"/);
 assert.match(html,/id="modelSearch"/);
 assert.match(html,/id="modelPicker"/);
 assert.match(conf,/clearProviderKey/);
 assert.match(turn,/providerHeaders\(body\?\.provider\)/);
 assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|document\.cookie/);
});
