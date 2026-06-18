import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Standalone output: el build produce .next/standalone con solo lo necesario
  // para runtime (server.js + node_modules acotado). Permite Docker images de
  // ~150MB en vez de 1GB+. Requerido por el Dockerfile del slice 8b.
  output: "standalone",

  // Skip TypeScript y ESLint en el build de producción. Los tipos se validan
  // en local (pnpm build) y en CI. En el VPS chico, el typecheck en runtime
  // satura la RAM (tsc usa 2-3GB) y bloquea el build por horas.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
