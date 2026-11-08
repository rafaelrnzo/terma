import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Compiler rules arrived with eslint-config-next 16. Existing effects sync external
    // systems (matchMedia, localStorage, URL) and the camera hook returns a ref; kept as warnings
    // until those components are refactored, so the upgrade does not rewrite QA'd UI.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  globalIgnores([
    "node_modules/**",
    "scripts/anatomy/vendor/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
