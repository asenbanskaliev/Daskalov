import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
/** Comparison of already-authorized audio experiments, never fetches providers or stores voice clips. */
export function normalizeSpanish(text){
 return String(text??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().split(" ").filter(Boolean);
}
export function wordErrorRate(reference,hypothesis){
 const a=normalizeSpanish(reference),b=normalizeSpanish(hypothesis);
 const matrix=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)matrix[i][j]=Math.min(
  matrix[i-1][j]+1,matrix[i][j-1]+1,matrix[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
 return a.length?matrix[a.length][b.length]/a.length:b.length?1:0;
}
export function assessAsrBatch(cases){
 if(!Array.isArray(cases)||!cases.length)throw Error("Muestras STT requeridas.");
 const entries=cases.map(c=>{
  if(!/^[A-Z0-9_-]{1,24}$/.test(c.id)||typeof c.expected!=="string"||typeof c.actual!=="string")throw Error("Caso STT inválido.");
  return {id:c.id,wer:Number(wordErrorRate(c.expected,c.actual).toFixed(4))};
 });
 if(new Set(entries.map(x=>x.id)).size!==entries.length)throw Error("ID STT duplicado.");
 return {samples:entries.length,meanWer:Number((entries.reduce((s,x)=>s+x.wer,0)/entries.length).toFixed(4)),
  cases:entries,actualAudioProvided:cases.every(x=>x.realAudioVerified===true),noTranscriptsExported:true};
}

export const STT_BROWSER_TARGETS=Object.freeze(["chrome","edge","firefox"]);
export const STT_DIFFICULT_IDS=Object.freeze(Array.from({length:20},(_,i)=>"AUDIO-"+String(i+1).padStart(2,"0")));
/**
 * Three real-browser STT matrices of the SAME 20 difficult audio cases.
 * Inputs are supplied offline by an operator; the tool does not prove origin
 * or contact STT vendors. Output contains only numeric WER, never transcripts.
 */
export function assessSttBrowserMatrix(reports){
 if(!Array.isArray(reports)||reports.length!==STT_BROWSER_TARGETS.length)throw Error("Se exigen Chrome, Edge y Firefox.");
 const byBrowser={},referenceById=new Map();
 for(const browser of STT_BROWSER_TARGETS){
  const matching=reports.filter(row=>row?.browser===browser);
  if(matching.length!==1)throw Error("Navegador ausente o duplicado: "+browser);
  const samples=matching[0].cases;
  if(!Array.isArray(samples)||samples.length!==STT_DIFFICULT_IDS.length)throw Error("Se necesitan 20 audios por navegador.");
  if(samples.some(row=>row.realAudioVerified!==true))throw Error("La matriz exige evidencia declarada de audio real.");
  if(samples.some(row=>typeof row.expected!=="string"||!row.expected.trim()))throw Error("Referencia de transcripción vacía.");
  const result=assessAsrBatch(samples);
  if(result.cases.length!==STT_DIFFICULT_IDS.length||result.cases.some(({id})=>!STT_DIFFICULT_IDS.includes(id)))
   throw Error("Se requieren exactamente AUDIO-01 a AUDIO-20.");
  for(const row of samples){
   const ref=referenceById.get(row.id);
   if(ref!==undefined&&ref!==row.expected)throw Error("Referencia diferente entre navegadores: "+row.id);
   referenceById.set(row.id,row.expected);
  }
  byBrowser[browser]={samples:result.samples,meanWer:result.meanWer,cases:result.cases};
 }
 return {schema:"daskalov-stt-browser-matrix-v1",caseIds:STT_DIFFICULT_IDS,
  byBrowser,noTranscriptsExported:true,submittedAudioClaims:STT_DIFFICULT_IDS.length*STT_BROWSER_TARGETS.length,
  independentEvidenceVerified:false,releaseApproved:false};
}
export function compareTtsEngines(measurements){
 if(!Array.isArray(measurements))throw Error("Medidas TTS requeridas.");
 const groups=new Map();
 for(const x of measurements){
  if(!["piper","kokoro"].includes(x.engine))throw Error("Motor desconocido.");
  if(!Number.isFinite(x.synthesisMs)||!Number.isFinite(x.audioDurationMs)||x.synthesisMs<0||x.audioDurationMs<=0)throw Error("Medida TTS inválida.");
  const rows=groups.get(x.engine)||[];
  rows.push({rtf:x.synthesisMs/x.audioDurationMs,licenseVerified:x.licenseVerified===true});
  groups.set(x.engine,rows);
 }
 return Object.fromEntries([...groups].map(([engine,rows])=>{
  const sorted=rows.map(x=>x.rtf).sort((a,b)=>a-b);
  const percentile=p=>Number(sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)].toFixed(3));
  return [engine,{samples:rows.length,rtfP50:percentile(.5),rtfP95:percentile(.95),
   allLicensesVerified:rows.every(x=>x.licenseVerified)}];
 }));
}
export function blindVoicePanel(votes){
 if(!Array.isArray(votes)||votes.length<3)throw Error("Mínimo tres evaluadores independientes.");
 const judges=new Set(votes.map(x=>x.judgeId));
 if(judges.size<3)throw Error("Evaluación ciega requiere tres evaluadores distintos.");
 if(votes.length!==judges.size*2)throw Error("Cada evaluador debe puntuar ambas voces, una sola vez.");
 for(const x of votes){
  if(!/^[A-Z0-9_-]{1,32}$/.test(x.judgeId)||!["VOICE_A","VOICE_B"].includes(x.voiceId))throw Error("Identificador inválido.");
  for(const field of ["intelligibility","naturalness","pronunciation","educationalAppropriateness"]){
   if(!Number.isInteger(x[field])||x[field]<1||x[field]>5)throw Error("Rúbrica fuera de 1 a 5.");
  }
 }
 const pairs=new Map();
 for(const vote of votes){
  const set=pairs.get(vote.judgeId)||new Set();
  if(set.has(vote.voiceId))throw Error("Voto duplicado de una voz para el mismo evaluador.");
  set.add(vote.voiceId);pairs.set(vote.judgeId,set);
 }
 for(const voices of pairs.values())if(voices.size!==2||!voices.has("VOICE_A")||!voices.has("VOICE_B"))
  throw Error("Panel ciego incompleto: falta evaluar ambas voces.");
 const byVoice={};
 for(const id of ["VOICE_A","VOICE_B"]){
  const found=votes.filter(x=>x.voiceId===id);
  if(!found.length)continue;
  const means={};
  for(const field of ["intelligibility","naturalness","pronunciation","educationalAppropriateness"]){
   means[field]=Number((found.reduce((v,x)=>v+x[field],0)/found.length).toFixed(2));
  }
  byVoice[id]={votes:found.length,means};
 }
 return {blind:true,pairedJudges:judges.size,completePairedPanel:true,byVoice,licenseAuditStillRequired:true,externalReviewVerified:false};
}
async function main(){
 const [mode,inputFile,outputFile]=process.argv.slice(2);
 if(!["stt","stt-matrix","tts","panel"].includes(mode)||!inputFile||!outputFile)throw Error("Uso: stt|stt-matrix|tts|panel input.json output.json");
 const rows=JSON.parse(await readFile(resolve(inputFile),"utf8"));
 const result=mode==="stt"?assessAsrBatch(rows):mode==="stt-matrix"?assessSttBrowserMatrix(rows):mode==="tts"?compareTtsEngines(rows):blindVoicePanel(rows);
 await writeFile(resolve(outputFile),JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write("Evaluación local completada sin incluir audio ni transcripciones en el informe.\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{process.stderr.write(e.message+"\n");process.exitCode=1;});
