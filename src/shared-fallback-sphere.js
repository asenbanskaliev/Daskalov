/** Reuse one sphere geometry for every procedural avatar part. */
export function createFallbackSphere({THREE,geometry,r,x,y,z,material,parent}){
 if(!Number.isFinite(r)||r<=0||!geometry||!material||!parent)throw Error("Esfera procedural inválida.");
 const mesh=new THREE.Mesh(geometry,material);
 mesh.scale.setScalar(r);
 mesh.position.set(x,y,z);
 parent.add(mesh);
 return mesh;
}
