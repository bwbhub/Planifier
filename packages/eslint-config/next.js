import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import { baseConfig, FORBIDDEN_LIBS, SERVER_PACKAGES } from "./base.js";

/** Les modules (features) de apps/web. Ajouter un module = l'ajouter ici. */
const FEATURES = ["account", "spaces", "events", "todo", "agenda"];

/** Une feature n'importe jamais une autre feature, ni app/ (skill feature-first-structure). */
function featureIsolation() {
  return FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: FEATURES.filter((f) => f !== feature)
                .map((f) => `@/features/${f}`)
                .concat(FEATURES.filter((f) => f !== feature).map((f) => `@/features/${f}/*`)),
              message:
                "Un module n'importe pas un autre module : passer par features/_shared ou packages/*.",
            },
            {
              group: ["@/app", "@/app/*"],
              message: "Une feature n'importe jamais app/ (sens : app → features → packages).",
            },
            SERVER_PACKAGES,
            ...FORBIDDEN_LIBS,
          ],
        },
      ],
    },
  }));
}

/**
 * Configuration des apps Next.
 * @param {string} tsconfigRootDir `import.meta.dirname` de l'app
 */
export function nextConfig(tsconfigRootDir) {
  return baseConfig(tsconfigRootDir, [
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: { globals: { ...globals.browser, ...globals.node } },
      plugins: { react: reactPlugin, "react-hooks": reactHooks, "@next/next": nextPlugin },
      settings: { react: { version: "detect" } },
      rules: {
        ...reactPlugin.configs.flat.recommended.rules,
        ...reactPlugin.configs.flat["jsx-runtime"].rules,
        ...reactHooks.configs.recommended.rules,
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs["core-web-vitals"].rules,
        "react/prop-types": "off",
        "react/no-unescaped-entities": "off",
        "no-restricted-exports": [
          "error",
          {
            restrictDefaultExports: {
              direct: true,
              named: true,
              defaultFrom: true,
              namedFrom: true,
              namespaceFrom: true,
            },
          },
        ],
      },
    },
    {
      // Les pages, layouts et configs Next exigent un export par défaut.
      files: [
        "src/app/**/{page,layout,loading,error,not-found,template,default}.tsx",
        "src/app/**/route.ts",
        "next.config.ts",
        "**/*.config.{js,mjs,ts}",
      ],
      rules: { "no-restricted-exports": "off" },
    },
    {
      files: ["src/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": ["error", { patterns: [SERVER_PACKAGES, ...FORBIDDEN_LIBS] }],
      },
    },
    ...featureIsolation(),
  ]);
}
