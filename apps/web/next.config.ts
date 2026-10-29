import type { NextConfig } from "next";

// Aucune valeur d'environnement ici : next.config est figé au build (« build once, run everywhere »).
const nextConfig: NextConfig = {
  // Sortie autonome pour l'image Docker : un seul dossier à copier.
  output: "standalone",
  // Les packages du workspace sont publiés en TypeScript : Next doit les compiler lui-même.
  transpilePackages: [
    "@planifier/ui",
    "@planifier/constants",
    "@planifier/domain-access",
    "@planifier/domain-recurrence",
    "@planifier/tokens",
    "@planifier/api-contract",
  ],
};

export default nextConfig;
