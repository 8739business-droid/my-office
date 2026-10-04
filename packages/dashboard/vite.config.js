import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 開発時(npm run dev)は API を別に起動したサーバー(既定 8739)へ中継する
const apiPort = process.env.MY_OFFICE_API_PORT || "8739";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
});
