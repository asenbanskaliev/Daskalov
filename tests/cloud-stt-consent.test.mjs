import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("STT-005: voice upload consent never stored persistently and no auto cloud fallback",()=>{
 const h=readFileSync("index.html","utf8"),client=readFileSync("src/voice-input.js","utf8"),recorder=readFileSync("src/local-stt.js","utf8");
 assert.match(h,/id="cloudSttConsent"/);assert.match(h,/value="cloudWhisper"/);
 assert.doesNotMatch(client,/writeSetting\("cloudSttConsent"/);
 assert.match(client,/cloudConsent/);
 assert.match(recorder,/x-daskalov-audio-consent/);
 assert.match(recorder,/Consentimiento revocado antes del envío/);
});
