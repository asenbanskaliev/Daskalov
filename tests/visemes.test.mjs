import test from "node:test";
import assert from "node:assert/strict";
import {VISEMES,mapSpanishGrapheme,estimateVisemeFrames,normalizeViseme} from "../src/visemes.js";
import {AudioTimeline} from "../src/audio-timeline.js";
test("AV-002: mapea fonemas básicos de español y rechaza acciones extrañas",()=>{
 const samples={mamá:"MBP",papá:"MBP",foca:"FV",lápiz:"L",chico:"CHSH",árbol:"A",isla:"I",elefante:"E",oso:"O",uva:"U"};
 for(const [word,expected] of Object.entries(samples))assert.equal(mapSpanishGrapheme(word),expected,word);
 assert.equal(normalizeViseme("eval"),"REST");
 assert.deepEqual(VISEMES,["REST","A","I","E","O","U","MBP","FV","L","CHSH"]);
});
test("AV-001/004: timeline con identificador, inicio, duración y visemas estimados",()=>{
 const t=new AudioTimeline();t.begin("turn-01");
 t.append({requestId:"turn-01",fragmentId:"a",text:"Hola mamá",audioStartMs:0,durationMs:600});
 assert.equal(t.fragments[0].approximate,true);
 assert.equal(t.at(600).viseme,"REST");
 assert.ok(["REST","O","MBP"].includes(t.at(400).viseme));
 t.append({requestId:"turn-01",fragmentId:"b",text:"¡Hola!",audioStartMs:600,durationMs:300});
 assert.equal(t.fragments.length,2);
 assert.throws(()=>t.append({requestId:"turn-02",fragmentId:"c",text:"",audioStartMs:900,durationMs:10}),/otra/);
 assert.throws(()=>t.append({requestId:"turn-01",fragmentId:"d",text:"",audioStartMs:100,durationMs:10}),/orden/);
 t.cancel();assert.equal(t.at(200).viseme,"REST");
});
test("AV-007: 20 retrasos y orden invertido nunca corrompen línea de tiempo",()=>{
 const t=new AudioTimeline();t.begin("turn-02");
 for(let i=0;i<20;i++)t.append({requestId:"turn-02",fragmentId:"f"+i,text:"Profesor " + i,audioStartMs:i*300,durationMs:300});
 for(let i=19;i>=0;i--)assert.throws(()=>t.append({requestId:"turn-02",fragmentId:"out"+i,text:"tarde",audioStartMs:i*300,durationMs:300}),/orden/);
 const frames=estimateVisemeFrames("La pizarra sabe bailar",2000,{startMs:100});
 assert.equal(frames.at(-1).atMs,2100);
 assert.ok(frames.every((v,i)=>i===0||v.atMs>=frames[i-1].atMs));
});
