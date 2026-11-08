import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("STT-004: documented Whisper launcher is loopback-only and requires preinstalled binary/model",()=>{
 const script=readFileSync("scripts/start-whisper-local.ps1","utf8");
 const guide=readFileSync("odd/operations/whisper-local.md","utf8");
 assert.match(script,/--host','127\.0\.0\.1'/);
 assert.match(script,/--convert/);
 assert.match(script,/Test-Path -LiteralPath \$Model/);
 assert.match(script,/--inference-path','\/inference'/);
 assert.match(guide,/DASKALOV_WHISPER_URL=http:\/\/127\.0\.0\.1:8080\//);
 assert.match(guide,/20 grabaciones reales/);
 assert.doesNotMatch(script,/DownloadFile|Invoke-WebRequest|iwr|iex/i);
});
