import type { NextConfig } from "next";

// Aucune valeur d'environnement ici : next.config est figé au build (« build once, run everywhere »).
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@planifier/ui", "@planifier/constants", "@planifier/tokens"],
};

export default nextConfig;
