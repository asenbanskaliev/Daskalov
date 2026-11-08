import test from "node:test";
import assert from "node:assert/strict";
import {restoreGameProgress} from "../src/progress-restore.js";
test("GAME-003: private progress restoration sends CSRF and no player ID",async()=>{
 let request,progress=null;
 const ok=await restoreGameProgress("token",()=>({restore:value=>progress=value}),{fetchImpl:async(url,init)=>{
  request={url,init};return {ok:true,json:async()=>({progress:[{lesson_id:"math",points:10}]})};
 }});
 assert.equal(ok,true);
 assert.equal(request.url,"/api/progress");
 assert.equal(request.init.headers["x-daskalov-csrf"],"token");
 assert.ok(!request.init.body.includes("playerId"));
 assert.equal(progress[0].lesson_id,"math");
});
test("GAME-003: unavailable server cannot break gameplay",async()=>{
 assert.equal(await restoreGameProgress("",()=>null),false);
 assert.equal(await restoreGameProgress("token",()=>null,{fetchImpl:async()=>{throw Error("offline");}}),false);
});
