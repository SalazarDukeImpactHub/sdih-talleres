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

  // Subir el límite de body de Server Actions a 10MB.
  // Default Next.js: 1MB → bloquea covers de imagen reales (1500×800 JPG suele pesar 1.5-3MB).
  // El código de uploadCover ya valida 5MB max — este límite es solo para que Next.js no corte
  // antes de que llegue al validador.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
