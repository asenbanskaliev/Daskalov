/**
 * Release procedural stand-in geometry only after the real GLB is ready.
 * Preserve shared box geometry and materials also used by the classroom.
 * Real GLTF meshes never enter this group.
 */
export function releaseProceduralAvatar({scene,root,sharedGeometry}){
 if(!scene||!root||typeof root.traverse!=="function"||typeof scene.remove!=="function")throw Error("Escena de respaldo inválida");
 const seen=new Set();
 root.traverse(node=>{
  const geometry=node?.geometry;
  if(!node?.isMesh||!geometry||geometry===sharedGeometry||seen.has(geometry))return;
  if(typeof geometry.dispose!=="function")throw Error("Geometría de respaldo no descartable");
  geometry.dispose();seen.add(geometry);
 });
 scene.remove(root);
 return {released:true,uniqueGeometriesDisposed:seen.size};
}
