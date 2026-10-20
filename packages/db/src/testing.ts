import { getDbEnv } from "./env";
import { createPrismaClient, type Db } from "./factory";
import { assertTestDatabase } from "./local-guard";

/** Client d'une base de test vérifiée, et remise à zéro de cette même base. */
export interface TestDatabase {
  db: Db;
  /** Vide toutes les tables de l'app (l'historique des migrations est gardé). */
  reset: () => Promise<void>;
}

/**
 * Base des tests d'intégration : la garde (`assertTestDatabase`, hôte local + suffixe `_test`) et le client
 * partagent la même URL, la remise à zéro ne peut donc viser qu'une base vérifiée. SQL constant : la liste des
 * tables est lue et citée par PostgreSQL.
 */
export function createTestDatabase(): TestDatabase {
  const { DATABASE_URL, NODE_ENV } = getDbEnv();
  assertTestDatabase(DATABASE_URL, NODE_ENV, "Base de test");
  const db = createPrismaClient(DATABASE_URL);
  return {
    db,
    reset: async () => {
      await db.$executeRaw`
        DO $$
        DECLARE tables text;
        BEGIN
          SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO tables
          FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations';
          IF tables IS NOT NULL THEN
            EXECUTE 'TRUNCATE ' || tables || ' RESTART IDENTITY CASCADE';
          END IF;
        END $$`;
    },
  };
}
