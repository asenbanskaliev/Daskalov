import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {VISEMES,visemeBlendshapeWeights} from "../src/visemes.js";
test("GFX-003/AV-002: all visemes are mapped to targets actually stored in skinned GLB",()=>{
 const data=readFileSync("public/assets/daskalov-lowpoly.glb");
 const size=data.readUInt32LE(12),json=JSON.parse(data.toString("utf8",20,20+size).trim());
 const face=json.meshes.find(m=>m.name==="Daskalov_FacialMorphs");
 const names=face.extras.targetNames;
 assert.equal(names.length,12);
 for(const name of ["mouthOpen","mouthWide","mouthNarrow","lipsClosed","lowerLipBite","tongueUp","lipsForward","browRaise","browFrown","blinkLeft","blinkRight","smile"])assert.ok(names.includes(name));
 for(const viseme of VISEMES)for(const key of Object.keys(visemeBlendshapeWeights(viseme)))assert.ok(names.includes(key));
 assert.ok(json.skins[0].joints.length>=7);
 assert.ok(json.accessors[json.skins[0].inverseBindMatrices].count>=7);
});
