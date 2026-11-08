import {readFile} from "node:fs/promises";
import {createPublicKey,verify} from "node:crypto";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
export const EXPECTED_TASKS=109;
export const REQUIRED_RELEASE_GATES=Object.freeze(["SEC-READY","WEB-READY","CONV-READY","STT-READY","VOICE-READY","3D-READY","AV-READY","MEM-READY","PERSONA-READY","GAME-READY","SEC-PUBLIC","PERF-READY"]);
export function parseChecklist(plan){
 const rows=[...String(plan).matchAll(/^- \[([ x])\] \*\*(S\d{2}\.\d{2})\*\*/gm)].map(x=>({id:x[2],done:x[1]==="x"}));
 return {total:rows.length,completed:rows.filter(x=>x.done).length,duplicateIds:rows.length-new Set(rows.map(x=>x.id)).size,outstanding:rows.filter(x=>!x.done).map(x=>x.id)};
}
export function signedPayload(a){
 return Buffer.from(JSON.stringify({sha:a.sha,issuedAt:a.issuedAt,reviewer:a.reviewer,gates:a.gates}),"utf8");
}
export function evaluateReleaseGate({plan,sha,attestation,publicKey}){
 const checklist=parseChecklist(plan),reasons=[];
 if(checklist.total!==EXPECTED_TASKS)reasons.push("El plan no contiene exactamente 109 tareas.");
 if(checklist.duplicateIds)reasons.push("IDs de tarea duplicados.");
 if(checklist.completed!==EXPECTED_TASKS)reasons.push(checklist.outstanding.length+" tareas ODD sin verificar.");
 if(!/^[0-9a-f]{40}$/.test(String(sha||"")))reasons.push("Falta SHA exacto del commit de release.");
 if(!attestation||!publicKey)reasons.push("Falta acta de revisión externa firmada y clave pública confiable.");
 else{
  if(attestation.sha!==sha)reasons.push("La revisión externa pertenece a otro commit.");
  if(typeof attestation.reviewer!=="string"||attestation.reviewer.trim().length<3)reasons.push("Revisor externo no identificado.");
  if(!Number.isFinite(Date.parse(attestation.issuedAt))||Math.abs(Date.now()-Date.parse(attestation.issuedAt))>30*86400000)reasons.push("Acta externa caducada o no válida.");
  const gates=new Map(Array.isArray(attestation.gates)?attestation.gates.map(x=>[x?.name,x]):[]);
  for(const name of REQUIRED_RELEASE_GATES){
   const item=gates.get(name);
   if(item?.status!=="passed"||typeof item.evidence!=="string"||!/^https:\/\/[^\s]+$/i.test(item.evidence))reasons.push(name+" carece de aceptación y evidencia externa.");
  }
  try{
   if(typeof attestation.signature!=="string"||!verify(null,signedPayload(attestation),createPublicKey(publicKey),Buffer.from(attestation.signature,"base64")))reasons.push("Firma Ed25519 de aprobación incorrecta.");
  }catch{reasons.push("Firma/clave pública de aprobación no verificable.");}
 }
 return {ready:!reasons.length,expectedTasks:EXPECTED_TASKS,...checklist,requiredGates:[...REQUIRED_RELEASE_GATES],reasons};
}
async function cli(){
 const mode=process.argv.includes("--full")?"full":"status";
 const plan=await readFile(resolve("odd/tasks/implementacion-full-odd-tdd.md"),"utf8");
 let attestation=null;
 if(process.env.DASKALOV_RELEASE_ATTESTATION_PATH){
  try{attestation=JSON.parse(await readFile(process.env.DASKALOV_RELEASE_ATTESTATION_PATH,"utf8"));}
  catch{if(mode==="full")throw Error("No se pudo leer el acta externa.");}
 }
 const result=evaluateReleaseGate({plan,sha:process.env.DASKALOV_EXPECTED_SHA||process.env.GITHUB_SHA||null,attestation,publicKey:process.env.DASKALOV_RELEASE_PUBLIC_KEY||null});
 const {outstanding,...summary}=result;
 process.stdout.write(JSON.stringify({...summary,outstandingCount:outstanding.length,firstOutstanding:outstanding.slice(0,15)},null,2)+"\n");
 if(mode==="full"&&!result.ready)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)cli().catch(error=>{process.stderr.write(error.message+"\n");process.exitCode=1;});
