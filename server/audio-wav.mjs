export function validateWaveHeader(input){
 const buffer=Buffer.from(input);
 if(buffer.length<44||buffer.toString("ascii",0,4)!=="RIFF"||buffer.toString("ascii",8,12)!=="WAVE"||buffer.toString("ascii",12,16)!=="fmt "||buffer.toString("ascii",36,40)!=="data")throw Error("WAV inválido.");
 const audioFormat=buffer.readUInt16LE(20),channels=buffer.readUInt16LE(22),sampleRate=buffer.readUInt32LE(24),bits=buffer.readUInt16LE(34);
 const dataBytes=buffer.readUInt32LE(40);
 if(audioFormat!==1||channels!==1||bits!==16||sampleRate<8000||sampleRate>48000||dataBytes===0||dataBytes>buffer.length-44)throw Error("Formato WAV no permitido.");
 return {sampleRate,channels,bitsPerSample:bits,dataBytes,durationSec:dataBytes/(sampleRate*2)};
}
export function encodePCM16MonoWav(samples,sampleRate=16000){
 if(!(samples instanceof Float32Array)||!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>48000||samples.length>sampleRate*30)throw Error("PCM no válido.");
 const dataBytes=samples.length*2,buf=Buffer.alloc(44+dataBytes);
 buf.write("RIFF",0);buf.writeUInt32LE(36+dataBytes,4);buf.write("WAVE",8);buf.write("fmt ",12);
 buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(sampleRate,24);
 buf.writeUInt32LE(sampleRate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write("data",36);buf.writeUInt32LE(dataBytes,40);
 for(let i=0;i<samples.length;i++){
  const n=Math.max(-1,Math.min(1,samples[i]||0));
  buf.writeInt16LE(n<0?Math.round(n*32768):Math.round(n*32767),44+i*2);
 }
 return buf;
}
