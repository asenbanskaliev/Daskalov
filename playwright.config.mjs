import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./e2e",
 retries:process.env.CI?1:0,
 workers:process.env.CI?1:undefined,
 timeout:35000,
 expect:{timeout:12000},
 reporter:process.env.CI?[["line"],["html",{open:"never"}]]:"list",
 use:{baseURL:"http://127.0.0.1:3000",trace:"retain-on-failure"},
 projects:[
  {name:"chromium",use:{...devices["Desktop Chrome"]}},
  {name:"firefox",use:{...devices["Desktop Firefox"]}}
 ],
 webServer:{
  command:"npm start",
  url:"http://127.0.0.1:3000/api/health",
  reuseExistingServer:!process.env.CI,
  timeout:120000,
  env:{DASKALOV_ALLOW_MEMORY:"0"}
 }
});
