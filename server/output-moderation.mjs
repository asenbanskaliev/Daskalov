import {redactSensitiveMemory} from "./character.mjs";
const SAFE_FALLBACK="Voy a explicarlo con respeto y de forma segura. Podemos volver a la lección.";
const patterns=[
 /(?:te voy a pegar|te voy a golpear|debes recibir una paliza|hay que castigar físicamente)/i,
 /(?:eres un inútil|eres idiota|nadie te quiere|eres tonto y no vales)/i,
 /(?:contraseña secreta|api[_ ]?key\s*[:=]|sk-proj-|Bearer\s+[A-Za-z0-9_-]{12,})/i,
 /<script\b|<iframe\b|javascript:/i
];
/** First line of defence, not a complete classifier or replacement for child safety audits. */
export function moderateProfessorOutput(text){
 const input=String(text??"");
 const unsafe=patterns.some(re=>re.test(input));
 const cleaned=unsafe?SAFE_FALLBACK:redactSensitiveMemory(input).replace(/<[^>]*>/g,"").trim();
 return {text:cleaned||SAFE_FALLBACK,blocked:unsafe};
}
