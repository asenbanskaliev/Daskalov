import test from "node:test";
import assert from "node:assert/strict";
import {createStaticBoxBatcher} from "../src/static-box-batcher.js";
class Dummy{
 constructor(){this.position={set:(...v)=>{this.p=v;}};this.scale={set:(...v)=>{this.s=v;}};}
 updateMatrix(){this.matrix={p:this.p,s:this.s};}
}
class Mesh{
 constructor(geometry,material,capacity){this.geometry=geometry;this.material=material;this.capacity=capacity;this.count=0;this.matrices=[];this.instanceMatrix={needsUpdate:false};}
 setMatrixAt(i,m){this.matrices[i]={...m};}
 computeBoundingSphere(){this.bound=true;}
}
test("GFX-006: 3 static boxes become 2 material batches without mutating positions",()=>{
 const scene={children:[],add(o){this.children.push(o);}},wood={},cream={};
 const b=createStaticBoxBatcher({THREE:{Object3D:Dummy,InstancedMesh:Mesh},scene,geometry:{},capacity:3});
 b.add(1,1,1,1,2,3,wood);b.add(2,1,1,4,5,6,wood);b.add(1,1,1,2,3,4,cream);
 assert.deepEqual(b.finalize(),{staticBoxInstances:3,staticBatchDrawCalls:2,staticDrawCallsSavedEstimate:1,hardwareMeasurement:false});
 assert.equal(scene.children.length,2);assert.equal(scene.children[0].count,2);
 assert.deepEqual(scene.children[0].matrices[1].p,[4,5,6]);
 assert.ok(scene.children.every(x=>x.frustumCulled&&x.bound&&x.instanceMatrix.needsUpdate));
 assert.throws(()=>b.add(-1,1,1,0,0,0,wood),/inválida/);
});
test("GFX-006: instance limit fails closed instead of silently dropping classroom furniture",()=>{
 const b=createStaticBoxBatcher({THREE:{Object3D:Dummy,InstancedMesh:Mesh},scene:{add(){}},geometry:{},capacity:1}),material={};
 b.add(1,1,1,0,0,0,material);
 assert.throws(()=>b.add(1,1,1,0,0,0,material),/agotada/);
});
