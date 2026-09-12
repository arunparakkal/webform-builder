import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "../..");

export default defineConfig({
  envDir: repoRoot,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "serve-embed-js",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url?.split("?")[0];
          if (url !== "/embed.js") {
            next();
            return;
          }
          try {
            const result = await server.transformRequest("/src/embed.ts");
            if (!result) {
              res.statusCode = 500;
              res.end("// embed transform failed");
              return;
            }
            res.setHeader("Content-Type", "application/javascript; charset=utf-8");
            res.end(result.code);
          } catch (err) {
            next(err);
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        embed: path.resolve(rootDir, "src/embed.ts"),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === "embed" ? "embed.js" : "assets/[name]-[hash].js"),
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
