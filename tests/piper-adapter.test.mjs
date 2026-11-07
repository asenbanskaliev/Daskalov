import test from "node:test";
import assert from "node:assert/strict";
import {synthesizePiper} from "../server/tts-piper.mjs";
import {encodePCM16MonoWav} from "../server/audio-wav.mjs";
test("TTS-004: Piper rechaza ejecución sin binario/modelo configurado",async()=>{
 await assert.rejects(()=>synthesizePiper({text:"Hola",env:{}}),e=>e.status===503);
});
test("TTS-004: Piper utiliza argumentos sin shell y borra audio temporal",async()=>{
 let argsSeen,workFile;
 const spawnImpl=(bin,args,options)=>{
  argsSeen={bin,args,options};
  workFile=args[args.indexOf("--output_file")+1];
  const {EventEmitter}=requireNodeEvents;
  const child=new EventEmitter();
  const {PassThrough}=nodeStreams;
  child.stdin=new PassThrough();
  child.kill=()=>child.emit("close",0);
  Promise.resolve().then(async()=>{
   const {writeFile}=nodeFS;
   await writeFile(workFile,encodePCM16MonoWav(new Float32Array([0,.2,-.2]),22050));
   child.emit("close",0);
  });
  return child;
 };
 const out=await synthesizePiper({text:"Buenos días",env:{DASKALOV_PIPER_BIN:"piper",DASKALOV_PIPER_MODEL:"/voices/es_ES-test.onnx"},spawnImpl});
 assert.equal(out.subarray(0,4).toString("ascii"),"RIFF");
 assert.equal(argsSeen.options.shell,false);
 assert.ok(argsSeen.args.includes("--model"));
 const {access}=nodeFS;
 await assert.rejects(()=>access(workFile));
});
