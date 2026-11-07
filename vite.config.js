import {defineConfig} from "vite";

export default defineConfig({
 publicDir: false,
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
