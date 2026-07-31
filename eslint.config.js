import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["node_modules", "dist", "coverage"],
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
  prettier,
);
