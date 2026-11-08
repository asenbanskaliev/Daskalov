import {defineConfig} from "vite";
import {readFile} from "node:fs/promises";

export default defineConfig({
 publicDir: false,
 plugins:[{
  name:"daskalov-bundled-avatar",
  apply:"build",
  async generateBundle(){
   const source=await readFile(new URL("./public/assets/daskalov-lowpoly.glb",import.meta.url));
   this.emitFile({type:"asset",fileName:"assets/daskalov-lowpoly.glb",source});
  }
 }],
 server: {
  host: "127.0.0.1",
  port: 5173,
  strictPort: true,
  proxy: {
   "/api": {target: "http://127.0.0.1:3000",changeOrigin: true}
  }
 },
 build: {
  outDir: "dist",
  assetsDir: "assets",
  target: "es2022",
  sourcemap: false,
  emptyOutDir: true
 }
});
