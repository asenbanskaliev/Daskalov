import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("WEB-001: Web entry is bundled via source and does not fetch runtime CDN modules",()=>{
 const html=readFileSync("index.html","utf8");
 const app=readFileSync("src/app.js","utf8");
 const scene=readFileSync("src/scene.js","utf8");
 const config=readFileSync("vite.config.js","utf8");
 assert.match(html,/src="\/src\/app\.js"/);
 assert.match(scene,/import\("three"\)/);
 assert.match(app,/from "\.\/scene\.js"/);
 assert.doesNotMatch(scene,/cdn\.jsdelivr\.net|unpkg\.com|https:\/\/.*three\.module/);
 assert.match(config,/publicDir:\s*false/);
});
