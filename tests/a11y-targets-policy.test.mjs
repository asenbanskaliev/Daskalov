import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("WEB-007: WCAG 2.2 touch target sizing and small viewport reflow are enforced by CSS",()=>{
 const css=readFileSync("src/style.css","utf8");
 assert.match(css,/button\{min-height:40px\}/);
 assert.match(css,/\.text-button\{min-height:32px;min-width:28px/);
 assert.match(css,/\.privacy\{flex-wrap:wrap;/);
 assert.match(css,/@media\(max-width:390px\)/);
});
