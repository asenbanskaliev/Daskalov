/** Open settings temporarily, then restore the classroom without losing state. */
export async function withSettings(page,action){
 await page.locator("#settingsToggle").click();
 try{return await action();}
 finally{await page.locator("#settingsClose").click();}
}
