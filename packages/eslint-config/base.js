import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/** Fichiers où process.env est autorisé : le point d'entrée de configuration de l'app. */
const ENV_FILES = ["**/env.ts", "**/env.*.ts"];

/** Bibliothèques écartées : un seul outil par besoin (docs/DEPENDANCES.md). */
const FORBIDDEN_LIBS = [
  {
    group: ["@mui/*", "@emotion/*"],
    message: "MUI est abandonné (ADR 0008) : utiliser packages/ui.",
  },
  {
    group: ["express", "jsonwebtoken", "bcryptjs"],
    message: "Remplacés par oRPC et Better Auth (ADR 0003, 0004).",
  },
];

/**
 * Configuration de base : TypeScript strict, aucun any, config d'environnement centralisée.
 * @param {string} tsconfigRootDir dossier du package (passer `import.meta.dirname`)
 * @param {import("eslint").Linter.Config[]} [extra] règles propres au package
 */
export function baseConfig(tsconfigRootDir, extra = []) {
  return tseslint.config(
    {
      ignores: [
        "**/node_modules/**",
        "**/.next/**",
        "**/dist/**",
        "**/coverage/**",
        "**/next-env.d.ts",
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/ban-ts-comment": [
          "error",
          { "ts-expect-error": "allow-with-description", minimumDescriptionLength: 10 },
        ],
        "no-restricted-imports": ["error", { patterns: FORBIDDEN_LIBS }],
        "no-restricted-properties": [
          "error",
          {
            object: "process",
            property: "env",
            message: "Lire l'environnement uniquement dans env.ts (getEnv()).",
          },
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "MemberExpression[property.name=/^NEXT_PUBLIC_/]",
            message: "NEXT_PUBLIC_* est interdit (build once, run everywhere).",
          },
        ],
        // Limites de taille et de complexité (skill code-structure).
        "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
        "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
        complexity: ["error", 10],
        "max-params": ["error", 4],
        "no-magic-numbers": "off",
        "no-empty": ["error", { allowEmptyCatch: false }],
        "eslint-comments/no-use": "off",
      },
    },
    {
      files: ENV_FILES,
      rules: { "no-restricted-properties": "off" },
    },
    {
      // Les fichiers de config JS ne sont pas couverts par tsconfig.
      files: ["**/*.js", "**/*.mjs"],
      ...tseslint.configs.disableTypeChecked,
    },
    ...extra,
    prettier,
  );
}
