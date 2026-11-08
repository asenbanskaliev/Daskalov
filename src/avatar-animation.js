/**
 * AnimationMixer clips for the editable GLB mesh nodes. The low-poly placeholder
 * lacks skin/morph targets; clips operate on named rigid meshes, not a skeleton.
 */
export const AVATAR_ANIMATIONS=Object.freeze(["idle","talk","look","point_board","surprised","ruler_desk","raise_hand"]);
export function createAvatarAnimator({THREE,root}){
 const arm=root.getObjectByName("Daskalov_ArmRight");
 const head=root.getObjectByName("Daskalov_Head");
 if(!arm||!head)throw Error("Avatar animation nodes missing.");
 const defs={
  idle:{arm:[0,0,0,0],head:[0,.013,0,-.013],duration:2},
  talk:{arm:[0,-.14,.06,0],head:[0,-.018,.018,0],duration:1},
  look:{arm:[0,.04,.04,0],head:[0,0,.04,0],duration:1},
  point_board:{arm:[0,-.7,-1.05,0],head:[0,.02,.03,0],duration:1},
  surprised:{arm:[0,.3,.16,0],head:[0,.1,-.06,0],duration:1},
  ruler_desk:{arm:[0,-.5,.8,0],head:[0,.04,0,0],duration:1},
  raise_hand:{arm:[0,-1.85,-2.05,-1.65],head:[0,.02,0,0],duration:1}
 };
 const mixer=new THREE.AnimationMixer(root),clips={},actions={};
 for(const [name,def] of Object.entries(defs)){
  const times=[0,def.duration*.33,def.duration*.66,def.duration];
  const q=def.arm.flatMap(z=>{
   const quaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,z));
   return quaternion.toArray();
  });
  const headY=head.position.y;
  const headValues=def.head.flatMap(delta=>[head.position.x,headY+delta,head.position.z]);
  const tracks=[
   new THREE.QuaternionKeyframeTrack("Daskalov_ArmRight.quaternion",times,q),
   new THREE.VectorKeyframeTrack("Daskalov_Head.position",times,headValues)
  ];
  clips[name]=new THREE.AnimationClip(name,def.duration,tracks);
  actions[name]=mixer.clipAction(clips[name]);
  actions[name].setLoop(["idle","talk"].includes(name)?THREE.LoopRepeat:THREE.LoopOnce,Infinity);
  actions[name].clampWhenFinished=true;
 }
 let current=null;
 function play(name){
  const selected=AVATAR_ANIMATIONS.includes(name)?name:"idle";
  if(current===selected)return;
  const prior=current?actions[current]:null;
  prior?.fadeOut(.12);
  const action=actions[selected];action.reset().fadeIn(.12).play();
  current=selected;
 }
 play("idle");
 return {
  clips,play,
  update(deltaSeconds){
   if(Number.isFinite(deltaSeconds)&&deltaSeconds>=0)mixer.update(Math.min(deltaSeconds,.1));
  },
  get current(){return current;},
  dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);}
 };
}
