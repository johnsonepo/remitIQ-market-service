import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["node_modules", "dist", "coverage", "generated", "eslint.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Prevent unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      // Force explicit return types
      // for important functions
      "@typescript-eslint/explicit-function-return-type": ["warn"],
      // Avoid any type
      "@typescript-eslint/no-explicit-any": ["warn"],
      // Cleaner code
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
  },
  {
    // Relax 'any' restrictions in test files, where loosely-typed
    // mocks (e.g. `(fn as any).mockResolvedValue(...)`) are common
    // and don't compromise real type safety, since the actual
    // application code under test remains fully typed.
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
);