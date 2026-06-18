import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright artefactos generados (HTML report trace, minified bundles).
    // Sin esto, eslint intenta lintar codeMirrorModule-*.js minificados y
    // explota con 164+ "errors" falsos. La regla ya estuvo en change 4 y
    // se perdió en un merge — restaurada acá para que no vuelva a pasar.
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
