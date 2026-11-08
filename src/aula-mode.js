/**
 * Presentation-only controller: no LLM calls, no speech changes, no user content
 * persistence and no scene recreation. Fullscreen targets the entire classroom
 * (including accessible chat, subtitles and settings), never the canvas alone.
 */
export function createAulaMode({find,documentRef=document,windowRef=window}={}){
 const layout=find("mainContent"),stage=find("sceneCanvas")?.closest(".stage");
 const conversation=find("conversationPanel"),drawer=find("settingsDrawer"),backdrop=find("drawerBackdrop");
 const settingsButton=find("settingsToggle"),closeButton=find("settingsClose");
 const lessonsButton=find("lessonsToggle"),historyButton=find("historyToggle");
 const fullscreenButton=find("fullscreenToggle");
 const activity=find("activityHub"),history=find("history");
 let immersive=false,drawerOpen=false,lessonsVisible=true,historyVisible=true;
 let previousNormal=null,focusBeforeDrawer=null;
 const setExpanded=(button,open,onLabel,offLabel)=>{
  button.setAttribute("aria-expanded",String(open));
  button.setAttribute("aria-label",open?onLabel:offLabel);
  button.title=open?onLabel:offLabel;
 };
 const setLessons=(value)=>{
  lessonsVisible=Boolean(value);
  activity.hidden=!lessonsVisible;
  layout.classList.toggle("lessons-open",lessonsVisible);
  setExpanded(lessonsButton,lessonsVisible,"Ocultar retos","Mostrar retos");
 };
 const setHistory=(value)=>{
  historyVisible=Boolean(value);
  history.hidden=!historyVisible;
  layout.classList.toggle("history-open",historyVisible);
  setExpanded(historyButton,historyVisible,"Ocultar historial","Mostrar historial");
 };
 function setSettings(open,{restoreFocus=true}={}){
  const desired=Boolean(open);
  if(desired===drawerOpen)return;
  if(desired){
   focusBeforeDrawer=documentRef.activeElement;
   drawer.hidden=false;
   backdrop.hidden=false;
   drawerOpen=true;
   stage.inert=true;
   conversation.inert=true;
   setExpanded(settingsButton,true,"Cerrar configuración","Abrir configuración");
   closeButton.focus();
  }else{
   drawerOpen=false;
   drawer.hidden=true;
   backdrop.hidden=true;
   stage.inert=false;
   conversation.inert=false;
   setExpanded(settingsButton,false,"Cerrar configuración","Abrir configuración");
   if(restoreFocus){
    const target=focusBeforeDrawer;
    if(target?.isConnected&&typeof target.focus==="function")target.focus();
    else settingsButton.focus();
   }
   focusBeforeDrawer=null;
  }
 }
 const syncMode=(active)=>{
  if(active===immersive)return;
  if(active){
   previousNormal={lessonsVisible,historyVisible};
   setSettings(false,{restoreFocus:false});
   setLessons(false);setHistory(false);
  }else{
   setSettings(false,{restoreFocus:false});
   if(previousNormal){
    setLessons(previousNormal.lessonsVisible);
    setHistory(previousNormal.historyVisible);
    previousNormal=null;
   }
  }
  immersive=active;
  layout.classList.toggle("is-immersive",immersive);
  documentRef.body.classList.toggle("aula-immersive-active",immersive);
  fullscreenButton.setAttribute("aria-pressed",String(immersive));
  const label=immersive?"Salir de pantalla completa":"Activar pantalla completa";
  fullscreenButton.setAttribute("aria-label",label);
  fullscreenButton.title=label;
  find("fullscreenLabel").textContent=immersive?"Salir":"Pantalla completa";
  find("fullscreenIcon").textContent=immersive?"⤢":"⛶";
 };
 async function enterFullscreen(){
  if(immersive)return;
  // The app remains usable on browsers that prohibit the native Fullscreen API.
  if(typeof layout.requestFullscreen==="function"){
   try{await layout.requestFullscreen();}catch{ /* CSS fallback below */ }
  }
  syncMode(true);
 }
 async function leaveFullscreen(){
  if(!immersive)return;
  if(documentRef.fullscreenElement===layout&&typeof documentRef.exitFullscreen==="function"){
   try{await documentRef.exitFullscreen();}catch{ /* CSS fallback below */ }
  }
  syncMode(false);
 }
 settingsButton.addEventListener("click",()=>setSettings(!drawerOpen));
 closeButton.addEventListener("click",()=>setSettings(false));
 backdrop.addEventListener("click",()=>setSettings(false));
 lessonsButton.addEventListener("click",()=>{
  if(drawerOpen)return;
  setLessons(!lessonsVisible);
  if(lessonsVisible&&immersive)find("lessonDifficulty")?.focus();
 });
 historyButton.addEventListener("click",()=>{
  if(drawerOpen)return;
  setHistory(!historyVisible);
  if(historyVisible&&immersive)history.focus?.();
 });
 fullscreenButton.addEventListener("click",()=>{if(immersive)void leaveFullscreen();else void enterFullscreen();});
 documentRef.addEventListener("fullscreenchange",()=>{
  if(documentRef.fullscreenElement===layout)syncMode(true);
  else if(immersive)syncMode(false);
 });
 documentRef.addEventListener("keydown",event=>{
  if(drawerOpen&&event.key==="Tab"){
   const controls=[...drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')]
    .filter(node=>node.getClientRects().length>0&&!node.closest("[hidden]"));
   if(!controls.length){event.preventDefault();closeButton.focus();return;}
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&(documentRef.activeElement===first||!drawer.contains(documentRef.activeElement))){
    event.preventDefault();last.focus();
   }else if(!event.shiftKey&&(documentRef.activeElement===last||!drawer.contains(documentRef.activeElement))){
    event.preventDefault();first.focus();
   }
  }
  if(event.key!=="Escape")return;
  if(drawerOpen){event.preventDefault();setSettings(false);return;}
  if(immersive&&lessonsVisible){event.preventDefault();setLessons(false);return;}
  if(immersive&&historyVisible){event.preventDefault();setHistory(false);return;}
  if(immersive){event.preventDefault();void leaveFullscreen();}
 });
 // Do not restore native fullscreen or consent from local storage.
 setLessons(true);
 setHistory(true);
 return {
  get immersive(){return immersive;},
  get settingsOpen(){return drawerOpen;},
  get lessonsVisible(){return lessonsVisible;},
  enterFullscreen,leaveFullscreen,
  openSettings:()=>setSettings(true),
  closeSettings:()=>setSettings(false)
 };
}
