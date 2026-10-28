import { textLinkClassName } from "@planifier/ui/lib/text-link";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell, ForgotPasswordForm } from "@/features/account";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Mot de passe oublié") };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      intro="Indique ton e-mail : tu recevras un lien pour en choisir un nouveau."
      footer={
        <Link href={ROUTES.signIn} className={textLinkClassName()}>
          Retour à la connexion
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
