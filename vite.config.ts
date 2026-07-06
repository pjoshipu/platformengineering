import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { claudeCliBridge } from "./vite-plugin-claude-cli";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // claudeCliBridge is dev-only (apply: "serve"); it lets `npm run dev` answer
  // /api/claude via the local Claude CLI. Harmless in build (self-disables).
  const plugins: any[] = [react(), claudeCliBridge()];

  // Only load lovable-tagger in development, and load it dynamically (ESM-safe)
  if (mode === "development") {
    const mod = await import("lovable-tagger");
    plugins.push(mod.componentTagger());
  }

  return {
    // Vercel serves at the domain root ("/"); GitHub Pages serves under "/platform/".
    // Vercel sets VERCEL=1 in the build environment.
    base: process.env.VERCEL ? "/" : "/platform/",
    server: {
      host: "::",
      port: 8080,
      // This repo lives in a OneDrive folder; OneDrive locks files as it syncs,
      // which made Vite's file watcher crash with EBUSY on loose images
      // (e.g. "Infra Flow - 5.jpg"). Don't watch binary/asset files that aren't
      // source — HMR for code is unaffected.
      watch: {
        ignored: [
          "**/*.jpg", "**/*.jpeg", "**/*.png", "**/*.gif",
          "**/*.pptx", "**/*.pdf", "**/*.zip",
        ],
      },
      proxy: {
        "/openai": {
          target: "https://api.openai.com",
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/openai/, ""),
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

