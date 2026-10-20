const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const TEST_DATABASE_SUFFIX = "_test";

/**
 * Opérations réservées à une base locale (seed, remise à zéro). NODE_ENV ne suffit pas (il vaut `development` par
 * défaut), c'est donc l'hôte de l'URL qui décide : un `.env.local` pointant vers Neon est refusé.
 */
export function assertLocalDatabase(databaseUrl: string, nodeEnv: string, action: string) {
  if (nodeEnv === "production") {
    throw new Error(`${action} refusé : NODE_ENV=production.`);
  }
  const { hostname } = new URL(databaseUrl);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`${action} refusé : la base n'est pas locale (hôte « ${hostname} »).`);
  }
}

/** Base locale **et** dédiée aux tests (nom en `_test`) : jamais la base de développement. */
export function assertTestDatabase(databaseUrl: string, nodeEnv: string, action: string) {
  assertLocalDatabase(databaseUrl, nodeEnv, action);
  const name = new URL(databaseUrl).pathname.slice(1);
  if (!name.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      `${action} refusé : la base « ${name} » n'est pas une base de test (suffixe _test).`,
    );
  }
}
