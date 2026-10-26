import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { getThemePreference, themeAttribute } from "@/features/account";
import { QueryProvider } from "@/lib/query-provider";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Planifier",
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
