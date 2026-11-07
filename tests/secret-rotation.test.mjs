import test from "node:test";
import assert from "node:assert/strict";
import {chatOllama} from "../server/ollama.mjs";
test("SEC-007: ensayo de rotación con credenciales ficticias sin registro ni coste",async()=>{
 const seen=[];
 const fetchImpl=async(url,opts)=>{seen.push({url,authorization:opts.headers.Authorization});return Response.json({message:{content:"¡Prueba!"}});};
 const options={provider:"cloud",model:"beam",messages:[{role:"user",content:"Hola"}],fetchImpl};
 await chatOllama({...options,env:{OLLAMA_API_KEY:"FAKE_A"}});
 await chatOllama({...options,env:{OLLAMA_API_KEY:"FAKE_B"}});
 assert.equal(seen[0].authorization,"Bearer FAKE_A");
 assert.equal(seen[1].authorization,"Bearer FAKE_B");
 assert.ok(!seen[1].authorization.includes("FAKE_A"));
 await assert.rejects(()=>chatOllama({...options,env:{}}),e=>e.status===503);
 assert.equal(seen.length,2);
});
