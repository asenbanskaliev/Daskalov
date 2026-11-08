import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("GFX-001/002: embedded 3D model is small GLB v2 with editable named parts",()=>{
 const buffer=readFileSync("public/assets/daskalov-lowpoly.glb");
 assert.ok(buffer.byteLength<250000);
 assert.equal(buffer.toString("ascii",0,4),"glTF");
 assert.equal(buffer.readUInt32LE(4),2);
 assert.equal(buffer.readUInt32LE(8),buffer.length);
 assert.equal(buffer.readUInt32LE(16),0x4e4f534a);
 const length=buffer.readUInt32LE(12);
 const gltf=JSON.parse(buffer.toString("utf8",20,20+length).trim());
 assert.equal(gltf.asset.version,"2.0");
 assert.equal(gltf.scene,0);
 assert.ok(gltf.meshes.length<=30);
 assert.ok(gltf.nodes.length>=12);
 for(const name of ["Daskalov_Head","Daskalov_Mouth","Daskalov_Torso","Daskalov_ArmRight"]){
  assert.ok(gltf.nodes.some(n=>n.name===name),name);
 }
 assert.equal(gltf.skins.length,1,"GLB has a real skin");
 assert.ok(gltf.skins[0].joints.length>=7,"Arms, legs, head and torso bones");
 const rigged=gltf.meshes.find(m=>m.name==="Daskalov_ClothesSkinned").primitives[0];
 assert.ok(rigged.attributes.JOINTS_0!==undefined);
 assert.ok(rigged.attributes.WEIGHTS_0!==undefined);
 assert.ok(rigged.attributes.TEXCOORD_0!==undefined,"UVs");
 const facial=gltf.meshes.find(m=>m.name==="Daskalov_FacialMorphs");
 assert.ok(facial);
 assert.equal(facial.primitives[0].targets.length,12);
 assert.ok(facial.extras.targetNames.includes("blinkLeft"));
 assert.ok(facial.extras.targetNames.includes("mouthOpen"));
 assert.ok(gltf.materials.length>=1);
 assert.ok(gltf.buffers[0].uri===undefined,"No external buffers allowed");
});
