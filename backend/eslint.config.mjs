// eslint.config.js (flat config - ESLint 9)
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Base recomendada de ESLint
      ...js.configs.recommended.rules,

      // Ajustes útiles en Node
      "no-console": "off",
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "error",

      // Compatibilidad con Prettier (evitar conflictos)
      // Si instalás eslint-config-prettier, podrías extenderlo aquí;
      // con flat config, basta con no imponer reglas de formato
    },
  },
];
