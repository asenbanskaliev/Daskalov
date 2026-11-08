import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {personaCases,PERSONA_DATASET_VERSION,EXPECTED_PERSONA_COUNTS} from "./persona-eval-cases.mjs";
export function datasetHash(){
 const canonical=personaCases().map(x=>({id:x.id,kind:x.kind,input:x.input,memories:x.memories,history:x.history}));
 return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
export function makeBaseline(report,{sha="unknown"}={}){
 if(report?.datasetVersion!==PERSONA_DATASET_VERSION)throw Error("La versión del dataset no coincide.");
 if(!report.model||report.mode!=="local")throw Error("Baseline por modelo requiere evaluación local real.");
 if(!Number.isInteger(report.actualModelCalls)||report.actualModelCalls<1||report.actualModelCalls!==report.actualAnswers?.length)throw Error("No hay resultados reales del modelo.");
 const cases=personaCases();
 const known=new Set(cases.map(x=>x.id));
 const answers=report.actualAnswers.map(x=>{
  if(!known.has(x.id)||!["humor","academic","injection","memory"].includes(x.kind))throw Error("Caso desconocido.");
  return {id:x.id,kind:x.kind,pass:x.pass===true,critical:[...new Set(Array.isArray(x.critical)?x.critical:[])]};
 });
 if(new Set(answers.map(x=>x.id)).size!==answers.length)throw Error("ID de evaluación duplicado.");
 return {datasetVersion:PERSONA_DATASET_VERSION,datasetSha256:datasetHash(),model:report.model,sha,
  total:answers.length,passed:answers.filter(x=>x.pass).length,answers};
}
export function compareBaseline(base,next){
 if(base?.datasetVersion!==next?.datasetVersion||base?.datasetSha256!==next?.datasetSha256||base?.model!==next?.model)throw Error("Baseline y evaluación no son comparables.");
 if(base.total!==next.total||base.answers.length!==next.answers.length)throw Error("Los casos evaluados no coinciden.");
 const former=new Map(base.answers.map(x=>[x.id,x]));
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
 const next=makeBaseline(report,{sha:process.env.DASKALOV_EXPECTED_SHA||"unknown"});
 if(mode==="create"){
  if(process.env.DASKALOV_ALLOW_BASELINE_CREATE!=="1")throw Error("Baseline requiere aprobación explícita.");
  await writeFile(resolve(baselinePath),JSON.stringify(next,null,2)+"\n",{flag:"wx",mode:0o600});
  process.stdout.write("Baseline sintético por modelo creado sin respuestas personales.\n");
 }else{
  const previous=JSON.parse(await readFile(resolve(baselinePath),"utf8"));
  const result=compareBaseline(previous,next);
  process.stdout.write(JSON.stringify(result)+"\n");
  if(!result.pass)process.exitCode=1;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{process.stderr.write(e.message+"\n");process.exitCode=1;});
