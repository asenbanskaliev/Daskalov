/** WCAG contrast calculator. Input: computed rgb/rgba strings, opaque backgrounds only. */
export function rgbChannels(value){
 const m=String(value).match(/^rgba?\(\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3})(?:\s*[,/]\s*([\d.]+))?\s*\)$/i);
 if(!m)throw Error("Color RGB no reconocido.");
 const channels=m.slice(1,4).map(Number),alpha=m[4]===undefined?1:Number(m[4]);
 if(channels.some(x=>x>255)||!Number.isFinite(alpha)||alpha!==1)throw Error("No se admiten colores translúcidos.");
 return channels;
}
export function contrastRatio(foreground,background){
 const luminance=color=>{
  const parts=rgbChannels(color).map(x=>x/255).map(x=>x<=0.04045?x/12.92:((x+.055)/1.055)**2.4);
  return parts[0]*.2126+parts[1]*.7152+parts[2]*.0722;
 };
 const l1=luminance(foreground),l2=luminance(background);
 return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
