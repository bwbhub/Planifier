import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell, SignInForm } from "@/features/account";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Connexion · Planifier" };

export default function SignInPage() {
  return (
    <AuthShell
      title="Connexion"
      intro="Retrouve tes listes, ton agenda et tes événements."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href={ROUTES.signUp} className="font-semibold text-accent-text underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
