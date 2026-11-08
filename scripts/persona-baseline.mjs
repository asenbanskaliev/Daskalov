import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {personaCases,PERSONA_DATASET_VERSION,EXPECTED_PERSONA_COUNTS} from "./persona-eval-cases.mjs";

export function datasetHash(){
 const canonical=personaCases().map(x=>({id:x.id,kind:x.kind,input:x.input,memories:x.memories,history:x.history}));
 return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/** Only complete 300-case real local results may become a model baseline. */
export function makeBaseline(report,{sha="unknown"}={}){
 if(report?.datasetVersion!==PERSONA_DATASET_VERSION)throw Error("La versión del dataset no coincide.");
 if(typeof report.model!=="string"||!/^[-\w.:/]{1,100}$/.test(report.model)||report.mode!=="local")throw Error("Baseline por modelo requiere evaluación local real.");
 const cases=personaCases(),byId=new Map();
 const expectedTotal=Object.values(EXPECTED_PERSONA_COUNTS).reduce((a,b)=>a+b,0);
 if(cases.length!==expectedTotal)throw Error("Dataset no cumple los conteos de cobertura.");
 if(!Array.isArray(report.actualAnswers)||report.actualAnswers.length!==expectedTotal||report.actualModelCalls!==expectedTotal)throw Error("Baseline exige cobertura completa de 300 llamadas reales, no una muestra parcial.");
 for(const answer of report.actualAnswers){
  if(typeof answer?.id!=="string"||byId.has(answer.id))throw Error("ID de evaluación duplicado o inválido.");
  if(typeof answer.pass!=="boolean"||!Array.isArray(answer.critical)||answer.critical.some(x=>typeof x!=="string"||x.length>60))throw Error("Resultado de evaluación inválido.");
  if(answer.pass&&answer.critical.length)throw Error("Un resultado crítico no puede pasar.");
  byId.set(answer.id,answer);
 }
 const counts=Object.fromEntries(Object.keys(EXPECTED_PERSONA_COUNTS).map(k=>[k,0]));
 const answers=cases.map(item=>{
  const answer=byId.get(item.id);
  if(!answer||answer.kind!==item.kind)throw Error("Caso ausente, desconocido o de categoría incorrecta.");
  counts[item.kind]++;
  return {id:item.id,kind:item.kind,pass:answer.pass,critical:[...new Set(answer.critical)].sort()};
 });
 if(answers.length!==byId.size||Object.keys(counts).some(k=>counts[k]!==EXPECTED_PERSONA_COUNTS[k]))throw Error("Cobertura del dataset incompleta.");
 return {datasetVersion:PERSONA_DATASET_VERSION,datasetSha256:datasetHash(),model:report.model,sha,
  coverage:counts,total:answers.length,passed:answers.filter(x=>x.pass).length,answers};
}
export function compareBaseline(base,next){
 if(base?.datasetVersion!==next?.datasetVersion||base?.datasetSha256!==next?.datasetSha256||base?.model!==next?.model)throw Error("Baseline y evaluación no son comparables.");
 if(base.total!==next.total||base.answers.length!==next.answers.length)throw Error("Los casos evaluados no coinciden.");
 const former=new Map(base.answers.map(x=>[x.id,x]));
 if(former.size!==base.answers.length)throw Error("Baseline con IDs duplicados.");
 const regressions=[];
 for(const answer of next.answers){
  const before=former.get(answer.id);
  if(!before||before.kind!==answer.kind)throw Error("Cambió el conjunto de casos.");
  if(before.pass&&!answer.pass)regressions.push(answer.id);
 }
 return {model:base.model,datasetSha256:base.datasetSha256,improved:next.passed-base.passed,regressions,pass:regressions.length===0};
}
async function main(){
 const [mode,baselinePath,reportPath]=process.argv.slice(2);
 if(!["create","compare"].includes(mode)||!baselinePath||!reportPath)throw Error("Uso: create <baseline.json> <report.json> | compare <baseline.json> <report.json>");
 const report=JSON.parse(await readFile(resolve(reportPath),"utf8"));
 const sha=process.env.DASKALOV_EXPECTED_SHA||"unknown";
 if(mode==="create"&&!/^[a-f0-9]{40}$/i.test(sha))throw Error("Creación de baseline requiere DASKALOV_EXPECTED_SHA exacto.");
 const next=makeBaseline(report,{sha});
 if(mode==="create"){
  if(process.env.DASKALOV_ALLOW_BASELINE_CREATE!=="1")throw Error("Baseline requiere aprobación explícita.");
  await writeFile(resolve(baselinePath),JSON.stringify(next,null,2)+"\n",{flag:"wx",mode:0o600});
  process.stdout.write("Baseline real local completo por modelo creado: sin respuestas personales.\n");
 }else{
  const previous=JSON.parse(await readFile(resolve(baselinePath),"utf8"));
  const result=compareBaseline(previous,next);
  process.stdout.write(JSON.stringify(result)+"\n");
  if(!result.pass)process.exitCode=1;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{process.stderr.write(e.message+"\n");process.exitCode=1;});
