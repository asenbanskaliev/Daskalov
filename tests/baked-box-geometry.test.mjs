import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {createBakedBoxGeometry,createBakedMaterial} from "../src/baked-box-geometry.js";
test("GFX-006: six-sided baked vertex shading uses no textures and darkens bottom/back faces",()=>{
 const geometry=createBakedBoxGeometry(THREE);
 const normals=geometry.getAttribute("normal"),colors=geometry.getAttribute("color");
 assert.equal(colors.count,normals.count);
 assert.equal(colors.itemSize,3);
 const shade=predicate=>{
  for(let i=0;i<normals.count;i++)if(predicate(normals,i))return colors.getX(i);
  throw Error("missing normal");
 };
 const top=shade((n,i)=>n.getY(i)>.9);
 const bottom=shade((n,i)=>n.getY(i)<-.9);
 const back=shade((n,i)=>n.getZ(i)<-.9);
 assert.equal(top,1);
 assert.ok(bottom<back&&back<top);
 assert.equal(geometry.getAttribute("uv").itemSize,2);
 const base=new THREE.MeshStandardMaterial({color:0x775533});
 const staticMaterial=createBakedMaterial(base);
 assert.equal(staticMaterial.vertexColors,true);
 assert.equal(base.vertexColors,false);
 assert.equal(staticMaterial.map,null);
 geometry.dispose();staticMaterial.dispose();base.dispose();
});
test("GFX-006: malformed material rejected rather than mutating dynamic avatar",()=>{
 assert.throws(()=>createBakedMaterial(null),/no válido/);
});
