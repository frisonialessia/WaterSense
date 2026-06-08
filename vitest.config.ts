import { defineConfig } from "vitest/config";
import path from "path";

// Resuelve el alias "@/..." igual que tsconfig, para que los tests
// importen del código real (p. ej. "@/lib/brain/decisionEngine").
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
});
