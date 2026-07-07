import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, "../..");
const packageName = "3d-image-transition";
const stationsPath = "stations";

export default defineConfig({
  plugins: [react(), vue()],
  base: `/${stationsPath}/${packageName}/`,
  root: "demo",
  build: {
    outDir: path.join(repoRoot, "dist", stationsPath, packageName),
    emptyOutDir: true,
  },
});
