import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {createFallbackSphere} from "../src/shared-fallback-sphere.js";
import {releaseProceduralAvatar} from "../src/release-procedural-avatar.js";
test("GFX-006: shared sphere geometry preserves individual radius, scaling and single disposal",()=>{
 const scene=new THREE.Scene(),teacher=new THREE.Group();scene.add(teacher);
 const shared=new THREE.SphereGeometry(1,12,10),material=new THREE.MeshStandardMaterial();
 const a=createFallbackSphere({THREE,geometry:shared,r:.48,x:0,y:2.6,z:0,material,parent:teacher});
 const b=createFallbackSphere({THREE,geometry:shared,r:.09,x:.18,y:2.7,z:.4,material,parent:teacher});
 assert.equal(a.geometry,b.geometry);
 assert.equal(a.geometry,shared);
 assert.equal(a.scale.x,.48);assert.equal(b.scale.y,.09);
 assert.equal(b.position.z,.4);
 let disposed=0;shared.addEventListener("dispose",()=>disposed++);
 const reclaimed=releaseProceduralAvatar({scene,root:teacher,sharedGeometry:new THREE.BoxGeometry(1,1,1)});
 assert.equal(reclaimed.uniqueGeometriesDisposed,1);
 assert.equal(disposed,1);
 assert.equal(scene.children.includes(teacher),false);
 material.dispose();
});
test("GFX-006: malformed radius cannot create fallback mesh",()=>{
 const geometry=new THREE.SphereGeometry(1),parent=new THREE.Group();
 assert.throws(()=>createFallbackSphere({THREE,geometry,r:0,parent,material:new THREE.MeshBasicMaterial(),x:0,y:0,z:0}),/inválida/);
 geometry.dispose();
});
