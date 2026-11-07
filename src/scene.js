export async function createClassroomScene({canvas,status,getYaw=()=>0,isSpeaking=()=>false,getReducedMotion=()=>false,onReady=()=>{},quality="auto"}){
 try{
  const THREE=await import("three");
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  let currentQuality=quality;
  const qualityScale={low:0.7,medium:1,high:1.5,auto:1.25};
  const pixelRatio=()=>Math.min(window.devicePixelRatio||1,qualityScale[currentQuality]||1.25);
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
  let animation="talk",until=0;
  const sceneState={
    act(value){animation=value;until=performance.now()+2400;},
    setQuality(value){currentQuality=value;renderer.setPixelRatio(pixelRatio());resize();}
  };
  onReady(sceneState);
  function frame(now){
   camera.rotation.set(0,getYaw(),0);
   const active=now<until;
   head.position.y=2.66+(getReducedMotion()?0:Math.sin(now*.0017)*.025);
   arm.rotation.z=active&&!getReducedMotion()&&animation==="ruler_desk"?.6+Math.sin(now*.015)*.36:0;
   mouth.scale.y=isSpeaking()?.30+Math.abs(Math.sin(now*.02))*.9:.18;
   teacher.rotation.y=getReducedMotion()?0:Math.sin(now*.0004)*.06;
   renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);status.textContent="Aula 3D lista";
 }catch{status.textContent="3D no disponible; puedes seguir hablando por texto.";}
}
