import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/core/**",
        "src/gen/**",
        "src/entities/**",
        "src/systems/**",
        "src/audio/hooves.ts",
      ],
    },
  },
});
