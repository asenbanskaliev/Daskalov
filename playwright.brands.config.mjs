import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./e2e",
 testMatch:"brand-smoke.spec.js",
 timeout:45000,
 retries:process.env.CI?1:0,
 workers:process.env.CI?1:undefined,
 reporter:"line",
 use:{baseURL:"http://127.0.0.1:3000"},
 projects:[
  {name:"google-chrome",use:{...devices["Desktop Chrome"],channel:"chrome"}},
  {name:"microsoft-edge",use:{...devices["Desktop Edge"],channel:"msedge"}}
 ],
 webServer:{
  command:"npm start",
  url:"http://127.0.0.1:3000/api/health",
  reuseExistingServer:!process.env.CI,
  timeout:120000,
  env:{DASKALOV_ALLOW_MEMORY:"0"}
 }
});
