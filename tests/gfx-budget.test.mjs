import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectGlb} from "../scripts/gfx-budget-report.mjs";
test("GFX-006/PERF-002: original skinned GLB meets geometry and size budgets",()=>{
 const report=inspectGlb(readFileSync("public/assets/daskalov-lowpoly.glb"));
 assert.equal(report.pass,true);
 assert.ok(report.triangles>0&&report.triangles<30000);
 assert.ok(report.drawCallsEstimate<=80);
 assert.ok(report.morphTargets>=10);
 assert.ok(report.skinnedMeshes>=1);
 assert.equal(report.estimatesOnly,true,"Not actual measured GPU VRAM");
});
test("GFX-006/PERF-002: excessive asset budgets fail closed",()=>{
 const bytes=readFileSync("public/assets/daskalov-lowpoly.glb");
 assert.equal(inspectGlb(bytes,{maxBytes:100}).pass,false);
 assert.throws(()=>inspectGlb(Buffer.from("invalid")),/GLB/);
});
