import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createMemoryUI} from "../src/memory-ui.js";
import {openMemory} from "../server/memory.mjs";
test("MEM-007: disabling opt-in revokes active session and clears locally cached history",async()=>{
 const dom=new Map(),handlers=new Map(),calls=[],history=[{role:"user",content:"privado"}];
 const find=id=>{
  if(!dom.has(id))dom.set(id,{checked:false,disabled:false,hidden:false,addEventListener:(name,handler)=>handlers.set(id+":"+name,handler)});
  return dom.get(id);
 };
 let revoked=0;
 const ui=createMemoryUI({find,history,onRevoke:()=>revoked++,showMessage:()=>{},
  fetchImpl:async(url,options={})=>{
   calls.push([url,options.method||"GET"]);
   if(url==="/api/session"&&options.method==="POST")return {ok:true,json:async()=>({csrfToken:"a".repeat(64)})};
   if(url==="/api/memory"&&options.method==="DELETE")return {ok:true};
   return {ok:true,json:async()=>({active:false,memoryAvailable:true})};
  }
 });
 ui.bind();
 find("remember").checked=true;
 await handlers.get("remember:change")();
 assert.equal(ui.csrfToken,"a".repeat(64));
 find("remember").checked=false;
 await handlers.get("remember:change")();
 assert.ok(calls.some(([path,method])=>path==="/api/memory"&&method==="DELETE"));
 assert.equal(ui.csrfToken,null);
 assert.deepEqual(history,[]);
 assert.equal(revoked,1);
});
test("MEM-007: deleting player cascades vectors, progress, consent and invalidates session",()=>{
 const db=openMemory(":memory:"),id=randomUUID(),credential="a".repeat(64);
 try{
  db.createSession(credential,id);db.save(id,"user","Recuerdo escolar");
  db.setMemoryConsent(id,true);db.recordProgress(id,"math",10);
  const row=db.exportPlayer(id).memories[0];
  db.putEmbedding(id,row.id,"embeddinggemma",[1,0,0]);
  assert.equal(db.resolveSession(credential),id);
  db.deletePlayer(id);
  assert.equal(db.resolveSession(credential),null);
  assert.deepEqual(db.search(id,"escolar"),[]);
  assert.deepEqual(db.getProgress(id),[]);
  assert.equal(db.integrity().ftsCount,0);
  assert.deepEqual(db.pendingEmbeddings(id,"embeddinggemma"),[]);
 }finally{db.close();}
});
