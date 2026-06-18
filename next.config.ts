import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Standalone output: el build produce .next/standalone con solo lo necesario
  // para runtime (server.js + node_modules acotado). Permite Docker images de
  // ~150MB en vez de 1GB+. Requerido por el Dockerfile del slice 8b.
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
