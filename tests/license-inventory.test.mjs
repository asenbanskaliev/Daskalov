import test from "node:test";
import assert from "node:assert/strict";
import {inventoryLicenses} from "../scripts/license-inventory.mjs";
test("SAFE-006: license and SHA inventory identifies missing rights and never green-lights release by itself",()=>{
 const report=inventoryLicenses({lock:{packages:{"node_modules/three":{version:"0.187.0",license:"MIT",integrity:"sha512-fake"},"node_modules/missing":{version:"1.0"}}},glb:Buffer.from("sample")});
 assert.equal(report.dependencies.count,2);
 assert.deepEqual(report.dependencies.missingDeclarations,["missing"]);
 assert.match(report.originalGlb.sha256,/^[a-f0-9]{64}$/);
 assert.equal(report.externalVoices.legalAndActorReviewRequired,true);
 assert.equal(report.releaseApproved,false);
 assert.equal(report.userDataIncluded,false);
});
