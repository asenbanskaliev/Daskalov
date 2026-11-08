export const $=id=>document.getElementById(id);
export function showMessage(role,text,{find=$}={}){
 const item=document.createElement("div");
 item.className="message "+role;
 item.textContent=text;
 const history=find("history");
 history.appendChild(item);
 history.scrollTop=history.scrollHeight;
 return item;
}
