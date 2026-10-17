import { baseConfig } from "@planifier/eslint-config/base";

// `src/generated` est produit par `prisma generate` : jamais édité ni linté.
export default baseConfig(import.meta.dirname, [{ ignores: ["src/generated/**"] }]);
