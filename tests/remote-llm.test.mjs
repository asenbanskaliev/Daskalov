import test from "node:test";
import assert from "node:assert/strict";
import {chatRemote,streamRemote,listRemoteModels,validateRemoteKey,isRemoteProvider,NVIDIA_MODEL_FALLBACK,providerChatError} from "../server/remote-llm.mjs";
import {setProviderKey,clearProviderKey,hasProviderKey,providerHeaders} from "../src/provider-credentials.js";
test("AI-011: keys only in tab memory, per-provider, not other headers",()=>{
 setProviderKey("openrouter","sk-or-v1-mocked-key");
 assert.equal(hasProviderKey("openrouter"),true);
 assert.deepEqual(providerHeaders("local"),{});
 assert.deepEqual(providerHeaders("nvidia"),{});
 assert.equal(providerHeaders("openrouter")["x-daskalov-provider-key"],"sk-or-v1-mocked-key");
 clearProviderKey("openrouter");assert.deepEqual(providerHeaders("openrouter"),{});
 assert.throws(()=>setProviderKey("nvidia","bad\nkey"));
});
test("AI-011: OpenRouter models are real catalog strings filtered to text modalities",async()=>{
 let req;const values=await listRemoteModels({provider:"openrouter",apiKey:"sk-or-v1-mock",fetchImpl:async(url,options)=>{
  req={url,options};return Response.json({data:[
   {id:"deepseek/deepseek-chat:free",architecture:{input_modalities:["text"],output_modalities:["text"]}},
   {id:"image/no-text",architecture:{input_modalities:["image"],output_modalities:["image"]}},
   {id:"invalid//model"}
  ]});
 }});
 assert.equal(req.url,"https://openrouter.ai/api/v1/models");
 assert.equal(req.options.headers.authorization,"Bearer sk-or-v1-mock");
 assert.deepEqual(values,["deepseek/deepseek-chat:free"]);
});
test("AI-011: NVIDIA endpoint and curated catalog only when listing route is unsupported",async()=>{
 const models=await listRemoteModels({provider:"nvidia",apiKey:"nvapi-mocked-key",fetchImpl:async(url)=>{assert.equal(url,"https://integrate.api.nvidia.com/v1/models");return new Response("",{status:404});}});
 assert.deepEqual(models,NVIDIA_MODEL_FALLBACK);
 await assert.rejects(()=>listRemoteModels({provider:"nvidia",apiKey:"nvapi-mocked-key",fetchImpl:async()=>new Response("SECRET",{status:401})}),e=>e.status===401&&!e.message.includes("SECRET"));
});
test("AI-011: remote chat is provider-locked and never returns hidden reasoning",async()=>{
 let request;
 const answer=await chatRemote({provider:"nvidia",apiKey:"nvapi-mocked-key",model:"openai/gpt-oss-120b",messages:[{role:"user",content:"hola"}],fetchImpl:async(url,options)=>{
  request={url,options};return Response.json({choices:[{message:{content:"Buenos días",reasoning_content:"never show"}}]});
 }});
 assert.equal(request.url,"https://integrate.api.nvidia.com/v1/chat/completions");
 assert.equal(JSON.parse(request.options.body).stream,false);
 assert.equal(answer,"Buenos días");
 assert.ok(!JSON.stringify(answer).includes("never show"));
 assert.equal(isRemoteProvider("cloud"),false);
 await assert.rejects(()=>chatRemote({provider:"nvidia",apiKey:"nvapi-mocked-key",model:"http://evil.test",messages:[{role:"user",content:"x"}]}),e=>e.status===400);
});
test("AI-011: fragmented OpenAI SSE yields visible text only, strips hidden reasoning",async()=>{
 const bytes=['data: {"choices":[{"delta":{"content":"Buenas ","reasoning_content":"secret"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":"tardes"}}]}\n\n','data: [DONE]\n\n'].join("");
 const encoded=new TextEncoder().encode(bytes);
 const stream=new ReadableStream({start(controller){controller.enqueue(encoded.slice(0,15));controller.enqueue(encoded.slice(15,47));controller.enqueue(encoded.slice(47));controller.close();}});
 const result=[];
 for await(const text of streamRemote({provider:"openrouter",apiKey:"sk-or-v1-mock",model:"deepseek/deepseek-chat:free",messages:[{role:"user",content:"hola"}],fetchImpl:async()=>new Response(stream)}))result.push(text);
 assert.deepEqual(result,["Buenas ","tardes"]);
});
test("AI-011: invalid credentials and upstream errors fail closed without leaking reply",async()=>{
 assert.throws(()=>validateRemoteKey("bad\nvalue"));
 await assert.rejects(()=>chatRemote({provider:"openrouter",apiKey:"sk-or-v1-mock",model:"deepseek/deepseek-chat:free",messages:[{role:"user",content:"x"}],fetchImpl:async()=>new Response("api-key-exposed",{status:429})}),e=>e.status===502&&!e.message.includes("api-key-exposed"));
});

test("AI-011: partially streamed SSE without [DONE] is never accepted as complete",async()=>{
 const stream=new ReadableStream({start(controller){
  controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Fragmento incompleto"}}]}\n\n'));
  controller.close();
 }});
 const output=[];
 await assert.rejects(async()=>{
  for await(const delta of streamRemote({provider:"openrouter",apiKey:"sk-or-v1-mock",
   model:"deepseek/deepseek-chat:free",messages:[{role:"user",content:"hola"}],
   fetchImpl:async()=>new Response(stream)}))output.push(delta);
 },/sin confirmación completa/);
 assert.deepEqual(output,["Fragmento incompleto"]);
});

test("AI-012: status 410 explains NVIDIA organization Public API Endpoints safely",()=>{
 const error=providerChatError("nvidia",410);
 assert.match(error.message,/HTTP 410/);
 assert.match(error.message,/Public API Endpoints/);
 assert.equal(error.status,502);
 assert.doesNotMatch(providerChatError("openrouter",429).message,/Public API Endpoints/);
});

test("AI-012: NVIDIA fallback never advertises Llama 3.1 8B after verified HTTP 410",()=>{
 assert.equal(NVIDIA_MODEL_FALLBACK.includes("meta/llama-3.1-8b-instruct"),false);
 assert.ok(NVIDIA_MODEL_FALLBACK.includes("deepseek-ai/deepseek-v4-flash"));
});
