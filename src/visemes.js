export const VISEMES=Object.freeze(["REST","A","I","E","O","U","MBP","FV","L","CHSH"]);
const VALID=new Set(VISEMES);
export function normalizeViseme(value){return VALID.has(value)?value:"REST";}
export function mapSpanishGrapheme(text){
 const word=String(text??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(!word)return "REST";
 if(/^(?:ch|sh|ll|x)/.test(word))return "CHSH";
 if(/^[bmp]/.test(word))return "MBP";
 if(/^[fv]/.test(word))return "FV";
 if(/^l/.test(word))return "L";
 for(const char of word){
  if("aeiou".includes(char))return char.toUpperCase();
 }
 return "REST";
}
export function estimateVisemeFrames(text,durationMs,{startMs=0}={}){
 const words=String(text).split(/\s+/u).filter(Boolean).slice(0,80);
 const validDuration=Math.max(30,Math.min(120000,Math.floor(Number(durationMs)||600)));
 const first=Math.max(0,Number(startMs)||0);
 if(!words.length)return [{atMs:first,viseme:"REST"},{atMs:first+validDuration,viseme:"REST"}];
 const step=validDuration/words.length;
 const frames=[{atMs:first,viseme:"REST"}];
 words.forEach((word,i)=>{
  const at=Math.round(first+step*i+Math.min(80,step*.25));
  frames.push({atMs:at,viseme:mapSpanishGrapheme(word)});
 });
 frames.push({atMs:first+validDuration,viseme:"REST"});
 return frames;
}

/** Named facial blendshape contract; geometrical placeholder uses manual mouth scaling. */
export const VISEME_BLENDSHAPES=Object.freeze([
 "mouthOpen","mouthWide","mouthNarrow","lipsClosed","lowerLipBite","tongueUp","lipsForward"
]);
export function visemeBlendshapeWeights(value){
 const viseme=normalizeViseme(value);
 const weights={
  REST:[0,0,0,1,0,0,0],
  A:[1,.35,0,0,0,0,0],
  I:[.35,1,0,0,0,0,0],
  E:[.55,.7,0,0,0,0,0],
  O:[.7,0,.85,0,0,0,.8],
  U:[.35,0,1,0,0,0,1],
  MBP:[0,0,0,1,0,0,0],
  FV:[.2,0,0,.15,1,0,0],
  L:[.45,.25,0,0,0,1,0],
  CHSH:[.3,0,.5,0,0,0,.5]
 };
 return Object.fromEntries(VISEME_BLENDSHAPES.map((name,i)=>[name,weights[viseme][i]]));
}
