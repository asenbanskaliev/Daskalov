/**
 * Only loads the original, same-origin low-poly GLB. Never accepts user supplied URLs.
 * The existing procedural teacher is the fail-safe fallback.
 */
export async function loadLowPolyAvatar({fetchImpl=fetch,loaderFactory,timeoutMs=6000}={}){
 const url="/assets/daskalov-lowpoly.glb";
 const response=await fetchImpl(url,{signal:AbortSignal.timeout(timeoutMs),credentials:"same-origin"});
 if(!response.ok)throw Error("Avatar GLB not available.");
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength<32||bytes.byteLength>250000)throw Error("Avatar exceeds budget or has invalid size.");
 const magic=new DataView(bytes).getUint32(0,true);
 if(magic!==0x46546c67)throw Error("Avatar is not a valid GLB.");
 const Loader=loaderFactory||((await import("three/examples/jsm/loaders/GLTFLoader.js")).GLTFLoader);
 const gltf=await new Promise((resolve,reject)=>new Loader().parse(bytes,"",resolve,reject));
 const root=gltf.scene;
 for(const name of ["Daskalov_Head","Daskalov_Mouth","Daskalov_ArmRight","Daskalov_Torso"]){
  if(!root.getObjectByName(name))throw Error("Missing required avatar node: "+name);
 }
 return {
  root,
  head:root.getObjectByName("Daskalov_Head"),
  mouth:root.getObjectByName("Daskalov_Mouth"),
  arm:root.getObjectByName("Daskalov_ArmRight"),
  approximate:true
 };
}
