import {AdaptiveQuality} from "./performance-profile.js";
import {normalizeViseme} from "./visemes.js";
import {loadLowPolyAvatar} from "./avatar-loader.js";
import {createAvatarAnimator} from "./avatar-animation.js";
import {GestureDirector} from "./gesture-director.js";
export async function createClassroomScene({canvas,status,getYaw=()=>0,isSpeaking=()=>false,getReducedMotion=()=>false,onReady=()=>{},quality="auto"}){
 try{
  const THREE=await import("three");
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  let currentQuality=quality;
  const adaptive=new AdaptiveQuality();
  const qualityScale={low:0.7,medium:1,high:1.5};
  const pixelRatio=()=>Math.min(window.devicePixelRatio||1,currentQuality==="auto"?adaptive.ratio:qualityScale[currentQuality]||1.25);
  renderer.setPixelRatio(pixelRatio());renderer.setClearColor(0x738475);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x718778);
  const camera=new THREE.PerspectiveCamera(55,1,0.1,100);
  camera.position.set(0,2.0,6.1);camera.lookAt(0,2,-2.8);
  scene.add(new THREE.HemisphereLight(0xfff1d0,0x465043,2.3));
  const light=new THREE.DirectionalLight(0xffe3bd,2.0);light.position.set(-3,7,5);scene.add(light);
  const mat=(hex)=>new THREE.MeshStandardMaterial({color:hex,roughness:0.85});
  const cream=mat(0xe4d7ab),wood=mat(0x7d5335),dark=mat(0x26342b),coat=mat(0x574f3f),skin=mat(0xe2ae83),black=mat(0x25221c),white=mat(0xffffff);
  function box(w,h,d,x,y,z,material,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);parent.add(o);return o;}
  function sphere(r,x,y,z,material,parent=scene){const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,16),material);o.position.set(x,y,z);parent.add(o);return o;}
  box(15,0.2,14,0,-0.1,-1,wood);
  box(15,7,.25,0,3.3,-7.7,cream);
  box(.22,7,14,-7.5,3.3,-1,cream);box(.22,7,14,7.5,3.3,-1,cream);
  box(5,2.3,.12,0,3.2,-7.51,dark);box(5.4,.13,.3,0,2,-7.35,wood);
  const chalkCanvas=document.createElement("canvas");chalkCanvas.width=512;chalkCanvas.height=220;
  const ctx=chalkCanvas.getContext("2d");ctx.fillStyle="#eee0b6";ctx.font="bold 38px Georgia";ctx.textAlign="center";
  ctx.fillText("EN MIS TIEMPOS…",256,75);ctx.font="24px Georgia";ctx.fillText("Profesor Daskalov",256,132);
  const chalkTexture=new THREE.CanvasTexture(chalkCanvas);
  const chalk=new THREE.Mesh(new THREE.PlaneGeometry(4.6,2),new THREE.MeshBasicMaterial({map:chalkTexture,transparent:true}));
  chalk.position.set(0,3.4,-7.42);scene.add(chalk);
  function setBlackboardMessage(message){
   const words=String(message||"").slice(0,140).split(/\s+/),lines=[];
   let current="";
   for(const word of words){
    const next=(current?current+" ":"")+word;
    if(next.length>28){if(current)lines.push(current);current=word;}
    else current=next;
   }
   if(current)lines.push(current);
   ctx.clearRect(0,0,512,220);
   ctx.fillStyle="#eee0b6";ctx.textAlign="center";
   ctx.font="bold 26px Georgia";
   for(const [index,line] of lines.slice(0,5).entries())ctx.fillText(line,256,40+index*38);
   chalkTexture.needsUpdate=true;
  }

  for(let i=-1;i<=1;i++){const x=i*2.45;box(1.55,.14,.9,x,.8,2.1,wood);box(.1,.75,.1,x-.64,.37,1.75,black);box(.1,.75,.1,x+.64,.37,1.75,black);}
  box(2.8,.2,1.2,2,1,-3.3,wood);box(.14,1,.14,.9,.45,-3.3,wood);box(.14,1,.14,3.1,.45,-3.3,wood);
  const teacher=new THREE.Group();teacher.position.set(-0.8,0,-3.4);scene.add(teacher);
  box(.95,1.35,.47,0,1.52,0,coat,teacher);
  box(.12,.65,.1,-.24,.4,0,black,teacher);box(.12,.65,.1,.24,.4,0,black,teacher);
  const head=sphere(.48,0,2.66,0,skin,teacher);
  sphere(.09,-.18,2.71,.43,white,teacher);sphere(.09,.18,2.71,.43,white,teacher);
  sphere(.044,-.18,2.71,.50,black,teacher);sphere(.044,.18,2.71,.50,black,teacher);
  sphere(.12,0,2.53,.49,skin,teacher);
  const moustacheL=sphere(.16,-.13,2.43,.45,black,teacher);moustacheL.scale.y=.30;
  const moustacheR=sphere(.16,.13,2.43,.45,black,teacher);moustacheR.scale.y=.30;
  const mouth=sphere(.11,0,2.30,.44,black,teacher);mouth.scale.y=.20;
  sphere(.42,0,2.95,-.07,mat(0x77736c),teacher).scale.y=.36;
  box(.20,.9,.18,-.65,1.65,0,coat,teacher);const hand=sphere(.12,-.65,1.1,0,skin,teacher);
  const arm=new THREE.Group();arm.position.set(.58,1.91,0);teacher.add(arm);
  box(.2,.82,.2,0,-.43,0,coat,arm);sphere(.13,0,-.85,0,skin,arm);box(.08,.72,.06,0,-1.03,.12,wood,arm);
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas);resize();
  let viseme="REST";
  const gestureDirector=new GestureDirector();
  const sceneState={
    act(value,source="llm"){
     const accepted=gestureDirector.propose(value,{source});
     if(accepted)avatarAnimator?.play(gestureDirector.current());
     return accepted;
    },
    setViseme(value){viseme=normalizeViseme(value);},
    clearSpeech(){viseme="REST";gestureDirector.clear();avatarAnimator?.play("idle");},
    setEmotion(value){if(value==="surprised")this.act("surprised");},
    setQuality(value){currentQuality=value;renderer.setPixelRatio(pixelRatio());resize();},
    setBlackboardMessage
  };
  onReady(sceneState);
  let avatar=null,avatarAnimator=null;
  loadLowPolyAvatar().then(model=>{
   avatar=model;
   avatarAnimator=createAvatarAnimator({THREE,root:model.root});
   model.root.position.copy(teacher.position);
   scene.add(model.root);
   teacher.visible=false;
   status.textContent="Aula 3D · personaje GLB local cargado";
  }).catch(()=>{ /* Procedural professor remains available. */ });
  let lastFrame=0;
  function frame(now){
   const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;
   if(lastFrame&&currentQuality==="auto"){
    const sample=adaptive.sample(now-lastFrame);
    if(sample?.changed){renderer.setPixelRatio(pixelRatio());resize();}
   }
   lastFrame=now;
   avatarAnimator?.update(dt);
   const currentGesture=gestureDirector.current();
   if(avatarAnimator&&avatarAnimator.current!==currentGesture)avatarAnimator.play(currentGesture);
   camera.rotation.set(0,getYaw(),0);
   const active=currentGesture!=="idle";
   const bob=getReducedMotion()?0:Math.sin(now*.0017)*.025;
   if(!avatarAnimator)head.position.y=2.66+bob;
   const armAngle=active&&!getReducedMotion()
    ?currentGesture==="ruler_desk"?.6+Math.sin(now*.015)*.36:currentGesture==="raise_hand"?-2:0:0;
   if(!avatarAnimator)arm.rotation.z=armAngle;
   const shapes={REST:[1,.18],A:[1,1.25],I:[1.35,.38],E:[1.1,.6],O:[.75,.95],U:[.65,.55],MBP:[.9,.12],FV:[1,.25],L:[1,.55],CHSH:[.8,.45]};
   const target=isSpeaking()?(shapes[viseme]||shapes.REST):shapes.REST;
   const activeMouth=avatar?.mouth||mouth;
   const baseX=avatar?.mouth?.userData.baseX||1,baseY=avatar?.mouth?.userData.baseY||1;
   if(avatar&&!avatar.mouth.userData.baseX){
    avatar.mouth.userData.baseX=avatar.mouth.scale.x;
    avatar.mouth.userData.baseY=avatar.mouth.scale.y;
   }
   activeMouth.scale.x+=(baseX*target[0]-activeMouth.scale.x)*.35;
   activeMouth.scale.y+=(baseY*target[1]-activeMouth.scale.y)*.35;
   const turn=getReducedMotion()?0:Math.sin(now*.0004)*.06;
   (avatar?.root||teacher).rotation.y=turn;
   renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);status.textContent="Aula 3D lista";
 }catch{status.textContent="3D no disponible; puedes seguir hablando por texto.";}
}
