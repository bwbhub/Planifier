import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { getThemePreference, themeAttribute } from "@/features/account";
import { COMMON_LABELS } from "@/lib/labels";
import { QueryProvider } from "@/lib/query-provider";

import "./globals.css";

// Fichiers dans le dépôt (`fonts/README.md`) : le build ne dépend pas du réseau vers Google Fonts.
const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  variable: "--font-bricolage",
  weight: "500 700",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  variable: "--font-dm-sans",
  weight: "400 600",
  display: "swap",
});

export const metadata: Metadata = {
  title: COMMON_LABELS.appName,
  description: "Todo, agenda et événements, à la carte.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Rendu serveur avec le thème du compte : aucun éclair de l'autre thème au chargement.
  const theme = themeAttribute(await getThemePreference());
  return (
    <html lang="fr" data-theme={theme} className={`${bricolage.variable} ${dmSans.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
