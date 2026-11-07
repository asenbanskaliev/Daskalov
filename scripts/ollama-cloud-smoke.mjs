const key=process.env.OLLAMA_API_KEY;
if(!key){console.error("OLLAMA_API_KEY no disponible en el job.");process.exitCode=1;}
else{
 const model=process.env.OLLAMA_CLOUD_MODEL||"beam",start=Date.now();
 try{
  const response=await fetch("https://ollama.com/api/chat",{method:"POST",headers:{Authorization:"Bearer "+key,"content-type":"application/json"},body:JSON.stringify({model,stream:false,messages:[{role:"system",content:"Responde en español brevemente."},{role:"user",content:"Di una frase breve indicando que estás preparado para enseñar."}],options:{num_predict:60}}),signal:AbortSignal.timeout(100000)});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const result=await response.json(),content=result?.message?.content;
  if(typeof content!=="string"||content.trim().length<2)throw new Error("Respuesta vacía");
  console.log("PASS Ollama Cloud: model="+model+" elapsed_ms="+(Date.now()-start)+" output_chars="+content.length);
 }catch(error){console.error("FAIL Ollama Cloud: "+error.name+" "+error.message);process.exitCode=1;}
}
