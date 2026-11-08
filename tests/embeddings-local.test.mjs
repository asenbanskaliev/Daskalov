import test from "node:test";
import assert from "node:assert/strict";
import {embedLocal,localEmbeddingEndpoint} from "../server/embeddings.mjs";
test("MEM-006: Ollama /api/embed local, sin clave Cloud ni endpoint arbitrario",async()=>{
 const env={DASKALOV_ENABLE_LOCAL_EMBEDDINGS:"1",DASKALOV_EMBED_MODEL:"embeddinggemma",OLLAMA_LOCAL_URL:"http://127.0.0.1:11434"};
 let request;
 const vector=await embedLocal({input:"Me gustan las matemáticas",env,fetchImpl:async(url,options)=>{
  request={url,options};return Response.json({embeddings:[[.2,.3,.4]]});
 }});
 assert.deepEqual(vector,[.2,.3,.4]);
 assert.equal(request.url,"http://127.0.0.1:11434/api/embed");
 assert.equal(JSON.parse(request.options.body).model,"embeddinggemma");
 assert.ok(!Object.hasOwn(request.options.headers,"authorization"));
});
test("MEM-006: host remoto, modelo ausente y vector malicioso fallan cerrado",async()=>{
 assert.throws(()=>localEmbeddingEndpoint({OLLAMA_LOCAL_URL:"http://example.org:11434"}),e=>e.status===503);
 await assert.rejects(()=>embedLocal({input:"hola",env:{}}),e=>e.status===503);
 await assert.rejects(()=>embedLocal({input:"hola",env:{DASKALOV_ENABLE_LOCAL_EMBEDDINGS:"1",DASKALOV_EMBED_MODEL:"embed"},fetchImpl:async()=>Response.json({embeddings:[[1,Infinity]]})}),e=>e.status===502);
});
