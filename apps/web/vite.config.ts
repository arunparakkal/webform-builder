import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "../..");

/** Public-page CSP (frame-ancestors * so customer embeds keep working). */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https: http://localhost:* ws://localhost:* wss:",
  "frame-ancestors *",
  "form-action 'self'",
].join("; ");

/** Vite HMR needs slightly looser script/connect rules in local dev. */
const DEV_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https: http://localhost:* ws://localhost:* wss:",
  "frame-ancestors *",
  "form-action 'self'",
].join("; ");

function applySecurityHeaders(
  middlewares: {
    use: (
      fn: (
        req: unknown,
        res: { setHeader: (k: string, v: string) => void },
        next: () => void,
      ) => void,
    ) => void;
  },
  policy: string,
) {
  middlewares.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", policy);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
}

export default defineConfig({
  envDir: repoRoot,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "security-headers",
      configureServer(server) {
        applySecurityHeaders(server.middlewares, DEV_CONTENT_SECURITY_POLICY);
      },
      configurePreviewServer(server) {
        applySecurityHeaders(server.middlewares, CONTENT_SECURITY_POLICY);
      },
    },
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
