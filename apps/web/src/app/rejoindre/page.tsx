import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/account";
import { JoinSpace } from "@/features/spaces";
import { ROUTES, signInReturningTo } from "@/lib/routes";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = {
  title: pageTitle("Rejoindre un Espace"),
  // Page d'un lien privé : jamais indexée, et l'adresse n'est pas transmise aux sites ouverts depuis elle.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Hors du groupe `(app)` : sans session, la connexion ramène ici. Le jeton reste dans le fragment de l'adresse, que
 * le navigateur garde à travers la redirection et n'envoie jamais au serveur.
 */
export default async function JoinSpacePage() {
  const user = await getCurrentUser();
  if (user === null) redirect(signInReturningTo(ROUTES.joinSpace));
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <JoinSpace />
    </main>
  );
}
