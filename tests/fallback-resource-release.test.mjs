import test from "node:test";
import assert from "node:assert/strict";
import {releaseProceduralAvatar} from "../src/release-procedural-avatar.js";
test("GFX-006: GLB replaces procedural scene and releases unique fallback geometries once",()=>{
 let releases=0,removed=0;
 const shared={dispose(){throw Error("Shared scene geometry must stay alive")}};
 const sphere={dispose(){releases++}};
 const root={traverse(fn){
  for(const node of [{isMesh:true,geometry:shared},{isMesh:true,geometry:sphere},
    {isMesh:true,geometry:sphere},{isMesh:false,geometry:{dispose(){throw Error("non-mesh")}}}])fn(node);
 }};
 const result=releaseProceduralAvatar({scene:{remove(arg){assert.equal(arg,root);removed++;}},root,sharedGeometry:shared});
 assert.deepEqual(result,{released:true,uniqueGeometriesDisposed:1});
 assert.equal(releases,1);assert.equal(removed,1);
});
test("GFX-006: invalid fallback scene fails rather than silently losing resources",()=>{
 assert.throws(()=>releaseProceduralAvatar({scene:null,root:null}),/inválida/);
});
