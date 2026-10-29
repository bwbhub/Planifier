import { textLinkClassName } from "@planifier/ui/lib/text-link";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell, LinkErrorNotice, ReturnNotice, SignInForm } from "@/features/account";
import { RETURN_PARAM, returnPathOf, ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Connexion") };

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  // Lien de vérification d'adresse expiré ou faux : Better Auth renvoie ici avec `?error=…`.
  const params = await searchParams;
  const { error } = params;
  const returnTo = returnPathOf(params[RETURN_PARAM]);
  return (
    <AuthShell
      title="Connexion"
      intro="Retrouve tes listes, ton agenda et tes événements."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href={ROUTES.signUp} className={textLinkClassName()}>
            Créer un compte
          </Link>
        </>
      }
    >
      {error === undefined ? null : (
        <LinkErrorNotice>
          Ce lien de confirmation n'est plus valable. Connecte-toi : un nouveau lien te sera envoyé.
        </LinkErrorNotice>
      )}
      <ReturnNotice returnTo={returnTo} />
      <SignInForm returnTo={returnTo} />
    </AuthShell>
  );
}
