/**
 * Deterministic extra safeguard, not a replacement for pediatric/clinical review,
 * independent moderation or legal parental authorization.
 */
export function safeDeterministicReply(text){
 const input=String(text||"").toLocaleLowerCase("es");
 if(/\b(?:quiero suicidarme|me quiero matar|no quiero vivir|quiero hacerme daño|me voy a autolesionar)\b/i.test(input)){
  return "Siento que estés pasando por un momento tan difícil. Por favor, busca ahora a una persona adulta de confianza para que te acompañe. Si estás en peligro inmediato, llama a emergencias. Podemos hablar de lo que te preocupa sin bromas.";
 }
 if(/\b(?:me pega[nr]?|abusan de m[ií]|me están acosando|me hacen bullying)\b/i.test(input)){
  return "Siento que estés viviendo eso. No mereces que te hagan daño. Cuéntaselo a un adulto de confianza, a tu familia o al equipo de orientación de tu centro. Podemos pensar juntos cómo pedir ayuda de forma segura.";
 }
 return null;
}
