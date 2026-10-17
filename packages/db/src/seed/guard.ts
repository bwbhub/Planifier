const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Comptes de démo : base locale uniquement. NODE_ENV ne suffit pas (il vaut `development` par défaut),
 * c'est donc l'hôte de l'URL qui décide : un `.env.local` pointant vers Neon est refusé.
 */
export function assertSeedAllowed(databaseUrl: string, nodeEnv: string) {
  if (nodeEnv === "production") {
    throw new Error("Seed refusé : NODE_ENV=production.");
  }
  const { hostname } = new URL(databaseUrl);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(`Seed refusé : la base n'est pas locale (hôte « ${hostname} »).`);
  }
}
