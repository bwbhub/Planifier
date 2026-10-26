import { textLinkClassName } from "@planifier/ui/lib/text-link";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell, SignUpForm } from "@/features/account";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Inscription · Planifier" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Créer un compte"
      intro="Todo, agenda et événements : tu actives seulement ce qui te sert."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href={ROUTES.signIn} className={textLinkClassName()}>
            Se connecter
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
