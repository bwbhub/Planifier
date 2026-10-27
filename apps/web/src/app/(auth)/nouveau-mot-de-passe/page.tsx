import { textLinkClassName } from "@planifier/ui/lib/text-link";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell, LinkErrorNotice, ResetPasswordForm } from "@/features/account";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Nouveau mot de passe · Planifier" };

/** Page où mène le lien de l'e-mail : `?token=…` s'il est valable, `?error=…` sinon (Better Auth). */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/nouveau-mot-de-passe">) {
  const { token, error } = await searchParams;
  const valid = typeof token === "string" && token !== "" && error === undefined;
  return (
    <AuthShell
      title="Nouveau mot de passe"
      intro="Choisis le mot de passe que tu utiliseras désormais."
      footer={
        <Link href={ROUTES.signIn} className={textLinkClassName()}>
          Retour à la connexion
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <LinkErrorNotice>
          Ce lien n'est plus valable.{" "}
          <Link href={ROUTES.forgotPassword} className={textLinkClassName()}>
            Demander un nouveau lien
          </Link>
        </LinkErrorNotice>
      )}
    </AuthShell>
  );
}
