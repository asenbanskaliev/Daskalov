const SECURITY_HEADERS=Object.freeze({
 "content-security-policy":"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' blob:; media-src 'self' blob:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
 "permissions-policy":"camera=(), geolocation=(), microphone=(self), payment=()",
 "x-frame-options":"DENY",
 "x-content-type-options":"nosniff",
 "referrer-policy":"no-referrer",
 "cross-origin-resource-policy":"same-origin"
});
export function installSecurityHeaders(res){
 for(const [key,value] of Object.entries(SECURITY_HEADERS))res.setHeader(key,value);
}
export function staticPolicy(){return {...SECURITY_HEADERS};}
