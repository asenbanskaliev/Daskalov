import {redactSensitiveMemory} from "./character.mjs";

/**
 * Deterministic first-line screening only. This is intentionally conservative:
 * ambiguous pupil-directed threats, secrecy requests and dangerous instructions
 * receive a safe fallback instead of reaching Web Audio, text events or SQLite.
 * Human child-safety review remains mandatory before public release.
 */
const SAFE_FALLBACK="Voy a explicarlo con respeto y de forma segura. Podemos volver a la lección.";
const BLOCK_PATTERNS=[
 // Bullying and direct threats by the fictional teacher.
 /\b(?:eres (?:un[ao]? )?(?:inútil|idiota|imbécil)|nadie te quiere|eres tonto y no vales|cállate(?: la boca)?[, !]*idiota)\b/i,
 /\b(?:te voy a (?:pegar|golpear|matar)|voy a hacerte daño|(?:debes|tienes que) (?:golpear|pegar|castigar físicamente)|hay que castigar físicamente|mereces una paliza|(?:golpea|pega) a (?:tu|un|una) compañer[oa])\b/i,
 // Unsafe instructions or coercion aimed at students.
 /\b(?:mezcla (?:lejía|cloro) (?:con|y) amon[ií]aco|(?:fabrica|construye|prepara) (?:una bomba|un explosivo)|hazte daño|deja de comer para adelgazar)\b/i,
 /\b(?:no se lo digas a tus padres|oc[uú]ltaselo a tus padres|guarda esto en secreto de tus padres|env[ií]ame tu (?:contraseña|dni|direcci[oó]n)|dame tu (?:contraseña|dni|direcci[oó]n))\b/i,
 // Credentials, executable markup and active links.
 /(?:contraseña secreta|api[_ ]?key\s*[:=]|sk-proj-|Bearer\s+[A-Za-z0-9_-]{12,})/i,
 /(?:<\s*(?:script|iframe|object|embed)\b|javascript\s*:|data\s*:\s*text\/html|onerror\s*=|onload\s*=)/i
];
export function moderateProfessorOutput(text){
 const input=String(text??"");
 const normalized=input.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/\s+/g," ");
 if(BLOCK_PATTERNS.some(re=>re.test(normalized)))return {text:SAFE_FALLBACK,blocked:true};
 const cleaned=redactSensitiveMemory(input).replace(/<[^>]*>/g,"").replace(/[\u0000-\u001f\u007f]/g," ").trim();
 return {text:cleaned||SAFE_FALLBACK,blocked:false};
}
