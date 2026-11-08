import test from "node:test";
import assert from "node:assert/strict";
import {AudioLipSync} from "../src/audio-lipsync.js";
import {VISEME_BLENDSHAPES,visemeBlendshapeWeights} from "../src/visemes.js";
test("AV-003: WebAudio clock drives approximate phoneme changes with no wall-clock drift",()=>{
 let now=0;
 const emitted=[],lip=new AudioLipSync({onViseme:x=>emitted.push(x)});
 assert.equal(lip.schedule({audioStartMs:1000,durationMs:500,text:"Mamá mira",clockMs:()=>now}),true);
 now=1000;assert.equal(lip.tick(),"REST");
 now=1100;assert.equal(lip.tick(),"MBP");
 now=1400;assert.equal(lip.tick(),"MBP");
 now=1500;assert.equal(lip.tick(),"REST");
 lip.cancel();
 assert.equal(lip.tick(),"REST");
 assert.ok(emitted.includes("MBP"));
});
test("AV-003: fragment with old ID after cancelled turn is rejected, timing remains monotonic",()=>{
 let now=0;const lip=new AudioLipSync();
 lip.schedule({audioStartMs:0,durationMs:200,clockMs:()=>now,text:"Hola"});
 assert.throws(()=>lip.schedule({audioStartMs:50,durationMs:100,clockMs:()=>now,text:"retrasado"}),/orden/);
 lip.cancel();
 assert.equal(lip.tick(),"REST");
 assert.equal(lip.schedule({audioStartMs:0,durationMs:250,clockMs:()=>now,text:"Chico"}),true);
});
test("AV-002: all ten visemes map into stable, bounded named blendshape slots",()=>{
 assert.equal(VISEME_BLENDSHAPES.length,7);
 for(const name of ["REST","A","I","E","O","U","MBP","FV","L","CHSH"]){
  const values=visemeBlendshapeWeights(name);
  assert.deepEqual(Object.keys(values),VISEME_BLENDSHAPES);
  assert.ok(Object.values(values).every(v=>v>=0&&v<=1));
 }
 assert.deepEqual(visemeBlendshapeWeights("arbitrary"),visemeBlendshapeWeights("REST"));
});
