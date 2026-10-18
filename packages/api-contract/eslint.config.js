import { baseConfig, FORBIDDEN_LIBS } from "@planifier/eslint-config/base";

// Le contrat est importé par le navigateur : aucune dépendance serveur (skill workspace-architecture).
export default baseConfig(import.meta.dirname, [
  {
    files: ["**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...FORBIDDEN_LIBS,
            {
              group: [
                "@planifier/api",
                "@planifier/db",
                "@planifier/auth",
                "@planifier/mails",
                "@orpc/server",
                "@orpc/server/*",
                "node:*",
              ],
              message: "Le contrat n'importe aucune dépendance serveur.",
            },
          ],
        },
      ],
    },
  },
]);
