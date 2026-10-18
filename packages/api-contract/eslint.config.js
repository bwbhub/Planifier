import { baseConfig, FORBIDDEN_LIBS, SERVER_PACKAGES } from "@planifier/eslint-config/base";

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
            SERVER_PACKAGES,
            { group: ["node:*"], message: "Le contrat est importé par le navigateur." },
          ],
        },
      ],
    },
  },
]);
