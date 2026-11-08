/** Batch static classroom boxes; dynamic avatar children remain individual meshes. */
export function createStaticBoxBatcher({THREE,scene,geometry,capacity=64}){
 if(!Number.isInteger(capacity)||capacity<1||capacity>4096)throw Error("Capacidad inválida");
 const batches=new Map(),dummy=new THREE.Object3D();
 let instances=0;
 function add(w,h,d,x,y,z,material){
  if(![w,h,d,x,y,z].every(Number.isFinite)||w<=0||h<=0||d<=0||!material)throw Error("Caja estática inválida");
  let mesh=batches.get(material);
  if(!mesh){
   mesh=new THREE.InstancedMesh(geometry,material,capacity);
   mesh.count=0;mesh.frustumCulled=true;batches.set(material,mesh);scene.add(mesh);
  }
  if(mesh.count>=capacity)throw Error("Capacidad de instancias agotada");
  dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();
  mesh.setMatrixAt(mesh.count++,dummy.matrix);
  instances++;
  return mesh;
 }
 function snapshot(){
  return {staticBoxInstances:instances,staticBatchDrawCalls:batches.size,
   staticDrawCallsSavedEstimate:Math.max(0,instances-batches.size),hardwareMeasurement:false};
 }
 function finalize(){
  for(const mesh of batches.values()){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
  return snapshot();
 }
 return {add,snapshot,finalize};
}
