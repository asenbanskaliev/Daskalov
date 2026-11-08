import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {AVATAR_ANIMATIONS,createAvatarAnimator} from "../src/avatar-animation.js";
function root(){
 const result=new THREE.Group(),head=new THREE.Object3D(),arm=new THREE.Object3D();
 head.name="Daskalov_Head";head.position.y=2.69;
 arm.name="Daskalov_ArmRight";arm.position.set(.63,1.69,0);
 result.add(head,arm);
 return {result,head,arm};
}
test("GFX-004: AnimationMixer exposes seven named clips and returns to idle",()=>{
 const {result,arm}=root();
 const animator=createAvatarAnimator({THREE,root:result});
 assert.deepEqual(Object.keys(animator.clips),[...AVATAR_ANIMATIONS]);
 for(const clip of Object.values(animator.clips))assert.equal(clip.validate(),true);
 animator.play("raise_hand");
 animator.update(.2);animator.update(.2);
 assert.ok(Math.abs(arm.quaternion.z)>.05,"The arm should visibly move");
 animator.play("idle");animator.update(.1);animator.update(.1);
 assert.equal(animator.current,"idle");
 animator.dispose();
});
test("GFX-004: unknown animation is restricted to safe idle",()=>{
 const model=root(),a=createAvatarAnimator({THREE,root:model.result});
 a.play("eval(");assert.equal(a.current,"idle");a.dispose();
});
