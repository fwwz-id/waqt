import { defineConfig } from "vitest/config";
import path from "node:path";

// Standalone vitest config — avoids loading the PWA/react plugins so the pure
// domain engine can be tested fast in a node environment.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    globals: false,
  },
});
