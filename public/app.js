import { TurnTrigger } from "/events.js";
const $=id=>document.getElementById(id);
const history=[],turn=new TurnTrigger();
let busy=false,playing=false,yaw=0,sceneState=null;
const preferences={provider:readSetting("provider")||"cloud",model:readSetting("model")||"beam"};
$("provider").value=preferences.provider;
$("model").value=preferences.model;
function readSetting(key){try{return localStorage.getItem("daskalov_"+key);}catch{return null;}}
function writeSetting(key,value){try{localStorage.setItem("daskalov_"+key,value);}catch{}}
function showMessage(role,text){
 const item=document.createElement("div");item.className="message "+role;item.textContent=text;$("history").appendChild(item);$("history").scrollTop=$("history").scrollHeight;
}
function say(text,animation="talk"){
 $("speechBubble").textContent="«"+text+"»";
 if(sceneState)sceneState.act(animation);
 if(!$("voiceEnabled").checked||!("speechSynthesis" in window))return;
 speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text);
 utterance.lang="es-ES";utterance.rate=0.94;utterance.pitch=0.88;
 const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith("es"));
 if(voices.length)utterance.voice=voices[0];
 utterance.onstart=()=>{playing=true;};
 utterance.onend=utterance.onerror=()=>{playing=false;};
 speechSynthesis.speak(utterance);
}
async function send(text,event="dialog"){
 if(busy)return;
 text=String(text).trim();if(!text)return;
 const provider=$("provider").value,model=$("model").value.trim();
 if(!model){showMessage("error","Selecciona un modelo.");return;}
 const remember=$("remember").checked,playerId=remember?getPlayerId():undefined;
 busy=true;$("sendButton").disabled=true;$("sendButton").textContent="Pensando…";
 if("speechSynthesis" in window)speechSynthesis.cancel();playing=false;
 showMessage("user",event==="turned_around"?"(Te giras para mirar detrás)":text);
 $("speechBubble").textContent="Daskalov está pensando…";
 try{
  const response=await fetch("/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider,model,text,event,remember,playerId,history:history.slice(-8)})});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||"No se ha podido conectar.");
  showMessage("assistant",result.reply);say(result.reply,result.animation);
  history.push({role:"user",content:text},{role:"assistant",content:result.reply});
  if(history.length>16)history.splice(0,history.length-16);
 }catch(error){showMessage("error",error.message);$("speechBubble").textContent="¡Caramba! No consigo conectar con la IA.";}
 finally{busy=false;$("sendButton").disabled=false;$("sendButton").textContent="Preguntar al profesor";}
}
function getPlayerId(){
 let id=readSetting("playerId");
 if(!id&&crypto.randomUUID){id=crypto.randomUUID();writeSetting("playerId",id);}
 return id;
}
async function refreshModels(){
 const provider=$("provider").value;
 if(provider==="local"&&$("model").value==="beam")$("model").value="";
 if(provider==="cloud"&&!$("model").value)$("model").value="beam";
 try{
  const r=await fetch("/api/models?provider="+provider);const data=await r.json();
  if(!r.ok)throw new Error(data.error);
  $("modelsList").replaceChildren();
  for(const name of data.models){const o=document.createElement("option");o.value=name;$("modelsList").appendChild(o);}
  if(provider==="local"&&!$("model").value&&data.models.length)$("model").value=data.models[0];
 }catch(error){showMessage("error",error.message||"No se pudieron consultar los modelos.");}
}
$("provider").addEventListener("change",()=>{writeSetting("provider",$("provider").value);refreshModels();});
$("model").addEventListener("change",()=>writeSetting("model",$("model").value));
$("chatForm").addEventListener("submit",event=>{event.preventDefault();const text=$("question").value;$("question").value="";send(text);});
$("forgetButton").addEventListener("click",async()=>{
 const playerId=readSetting("playerId");
 if(!playerId){showMessage("assistant","No hay recuerdos persistentes en este navegador.");return;}
 try{
  const r=await fetch("/api/memory",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({playerId})});
  if(!r.ok)throw new Error("No se ha podido borrar la memoria.");
  localStorage.removeItem("daskalov_playerId");history.length=0;
  showMessage("assistant","Los recuerdos guardados de este navegador se han borrado.");
 }catch(error){showMessage("error",error.message);}
});
let recognition=null;
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){
 recognition=new SpeechRecognition();recognition.lang="es-ES";recognition.interimResults=false;recognition.maxAlternatives=1;
 recognition.onresult=e=>send(e.results[0][0].transcript);
 recognition.onerror=e=>showMessage("error","Micrófono: "+e.error+". Puedes escribir tu pregunta.");
 recognition.onend=()=>{$("micButton").textContent="Micrófono";};
 $("micButton").addEventListener("click",()=>{
  try{if("speechSynthesis" in window)speechSynthesis.cancel();recognition.start();$("micButton").textContent="Escuchando…";}catch{showMessage("error","No se pudo iniciar el micrófono.");}
 });
}else{$("micButton").disabled=true;$("micButton").title="Reconocimiento de voz no disponible; utiliza el teclado.";}
async function checkHealth(){
 try{
  const r=await fetch("/api/health"),data=await r.json();
  $("apiDot").classList.toggle("ok",!!data.ok);
  $("apiStatus").textContent=data.ok?"Servidor conectado"+(data.cloudConfigured?" · Cloud configurado":" · Cloud sin clave"):"Servidor desconectado";
 }catch{$("apiStatus").textContent="Servidor desconectado";}
}
async function create3D(){
 try{
  const THREE=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
  const canvas=$("sceneCanvas"),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setClearColor(0x738475);
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
  sceneState={act(value){animation=value;until=performance.now()+2400;}};
  function frame(now){
   camera.rotation.set(0,yaw,0);
   const active=now<until;
   head.position.y=2.66+Math.sin(now*.0017)*.025;
   arm.rotation.z=active&&animation==="ruler_desk"?.6+Math.sin(now*.015)*.36:0;
   mouth.scale.y=playing?.30+Math.abs(Math.sin(now*.02))*.9:.18;
   teacher.rotation.y=Math.sin(now*.0004)*.06;
   renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);$("sceneStatus").textContent="Aula 3D lista";
 }catch{$("sceneStatus").textContent="3D no disponible; puedes seguir hablando por texto.";}
}
window.addEventListener("keydown",e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
 if(e.key==="ArrowLeft"||e.key==="ArrowRight"){
  e.preventDefault();yaw=Math.max(-1.4,Math.min(1.4,yaw+(e.key==="ArrowLeft"?.22:-.22)));
  if(turn.update(yaw)&&$("autoTurn").checked)send("Me he girado a mirar a mis compañeros.","turned_around");
 }
 if(e.key==="Home")yaw=0;
});
checkHealth();refreshModels();create3D();
