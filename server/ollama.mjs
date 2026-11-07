export class OllamaError extends Error {
 constructor(message,status=502){super(message);this.name="OllamaError";this.status=status;}
}
export function validateProvider(value) {
 if(value!=="cloud"&&value!=="local")throw new OllamaError("Proveedor no admitido.",400);
 return value;
}
export function validateModel(value) {
 if(typeof value!=="string"||!/^[a-zA-Z0-9._:-]{1,100}$/.test(value))throw new OllamaError("Modelo inválido.",400);
 return value;
}
export function connection(provider,env=process.env) {
 validateProvider(provider);
 if(provider==="cloud") {
  if(!env.OLLAMA_API_KEY)throw new OllamaError("Configura OLLAMA_API_KEY en el servidor.",503);
  return {base:"https://ollama.com",headers:{Authorization:"Bearer "+env.OLLAMA_API_KEY}};
 }
 const url=new URL(env.OLLAMA_LOCAL_URL||"http://127.0.0.1:11434");
 if(!["http:","https:"].includes(url.protocol)||url.username||url.password)throw new OllamaError("OLLAMA_LOCAL_URL inválido.",503);
 return {base:url.origin,headers:{}};
}
export async function chatOllama({provider,model,messages,fetchImpl=fetch,env=process.env}) {
 validateModel(model);
 const {base,headers}=connection(provider,env);
 let response;
 try {
  response=await fetchImpl(base+"/api/chat",{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify({model,messages,stream:false,options:{num_predict:180}}),signal:AbortSignal.timeout(90000)});
 }catch{throw new OllamaError("No se ha podido conectar con Ollama.",502);}
 if(!response.ok)throw new OllamaError("Ollama devolvió HTTP "+response.status+".",502);
 let data;try{data=await response.json();}catch{throw new OllamaError("Ollama devolvió JSON inválido.",502);}
 if(typeof data.message?.content!=="string"||!data.message.content.trim())throw new OllamaError("Ollama no devolvió texto.",502);
 return data.message.content;
}
export async function listOllamaModels({provider,fetchImpl=fetch,env=process.env}) {
 validateProvider(provider);
 if(provider==="cloud")return ["beam","gpt-oss:20b","deepseek-v4.1-flash"];
 const {base}=connection("local",env);
 try{
  const res=await fetchImpl(base+"/api/tags",{signal:AbortSignal.timeout(7000)});
  if(!res.ok)throw new Error("bad status");
  const data=await res.json();
  return Array.isArray(data.models)?data.models.map(m=>m.name).filter(x=>typeof x==="string"):[];
 }catch{throw new OllamaError("No es posible consultar los modelos locales.",502);}
}
