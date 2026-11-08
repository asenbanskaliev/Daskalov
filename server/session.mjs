import {createHash, randomBytes, randomUUID, timingSafeEqual} from "node:crypto";

const COOKIE = "daskalov_sid";
const TOKEN_RE = /^[a-f0-9]{64}$/;
const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

export function tokenHash(token) {
 if(typeof token!=="string"||!TOKEN_RE.test(token))return null;
 return createHash("sha256").update(token).digest("hex");
}
export function csrfFor(token) {
 return createHash("sha256").update("csrf:"+token).digest("hex");
}
export function cookieToken(req) {
 const value=String(req.headers.cookie||"");
 const pair=value.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
 const token=pair?.slice(COOKIE.length+1);
 return TOKEN_RE.test(token||"")?token:null;
}
export function getSession(req,store){
 const token=cookieToken(req);
 if(!token)return null;
 const keyHash=tokenHash(token);
 const playerId=store.resolveSession(keyHash);
 if(!playerId)return null;
 return {playerId,keyHash,csrfToken:csrfFor(token)};
}
export function createSession(store,options={}){
 const token=randomBytes(32).toString("hex");
 const keyHash=tokenHash(token);
 const playerId=randomUUID();
 store.createSession(keyHash,playerId);
 const secure=options.secure===true?"; Secure":"";
 return {
  playerId,
  csrfToken:csrfFor(token),
  cookie:COOKIE+"="+token+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+SESSION_LIFETIME_SECONDS+secure
 };
}
export function clearSessionCookie(secure=false){
 return COOKIE+"=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"+(secure?"; Secure":"");
}
export function csrfIsValid(req,session) {
 const token=req.headers["x-daskalov-csrf"];
 if(!session||typeof token!=="string"||!TOKEN_RE.test(token))return false;
 return timingSafeEqual(Buffer.from(token,"hex"),Buffer.from(session.csrfToken,"hex"));
}
export function isSameSiteRequest(req){
 if(req.headers["sec-fetch-site"]==="cross-site")return false;
 const origin=req.headers.origin;
 if(!origin)return true;
 try{
  const parsed=new URL(origin);
  const expected=new URL("http://"+req.headers.host);
  return (parsed.protocol==="https:"||parsed.protocol==="http:")&&parsed.host===expected.host;
 }catch{return false;}
}
