import { defineConfig, env } from "prisma/config";

// Configuration de la CLI Prisma 7 : l'URL de la base n'est plus dans schema.prisma.
// La CLI (migrate) exige une connexion directe, jamais le pooler (voir README, section Neon).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/seed/index.ts",
  },
  datasource: { url: env("DATABASE_URL_UNPOOLED") },
});
