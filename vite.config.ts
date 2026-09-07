import { defineConfig } from "vite";
import { resolve } from "path";

// 멀티 페이지 빌드: index.html(M0 플레이 가능 프로토타입), m1.html(M-1 실험)
export default defineConfig({
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        m1: resolve(__dirname, "m1.html"),
      },
    },
  },
});
