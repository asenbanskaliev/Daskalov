/**
 * Original procedural, texture-free baked ambient shading for classroom boxes.
 * Six face normals from BoxGeometry receive precomputed, direction-aware tones.
 * This uses a single vertex-color buffer and requires no texture download/VRAM.
 */
export function createBakedBoxGeometry(THREE){
 const geometry=new THREE.BoxGeometry(1,1,1);
 const normals=geometry.getAttribute("normal");
 if(!normals||normals.itemSize!==3)throw Error("Geometría de caja sin normales.");
 const colors=[];
 for(let i=0;i<normals.count;i++){
  const y=normals.getY(i),x=normals.getX(i),z=normals.getZ(i);
  const shade=y>.9?1:y<-.9?.65:z<-.9?.77:z>.9?.86:x<0?.81:.9;
  colors.push(shade,shade,shade);
 }
 geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
 return geometry;
}
export function createBakedMaterial(original){
 if(!original?.isMaterial||typeof original.clone!=="function")throw Error("Material de aula no válido.");
 const material=original.clone();
 material.vertexColors=true;
 material.needsUpdate=true;
 return material;
}
