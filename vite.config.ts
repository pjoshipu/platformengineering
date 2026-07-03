import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];

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

