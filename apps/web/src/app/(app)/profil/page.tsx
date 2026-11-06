import type { Metadata } from "next";
import { PageHeader } from "@planifier/ui/components/page-header";
import { Card } from "@planifier/ui/components/card";
import { redirect } from "next/navigation";

import { getCurrentUser, ModulesForm, PasswordForm, ProfileForm } from "@/features/account";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Mon profil") };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 pb-10">
      <PageHeader title="Mon profil" subtitle={user.email} />
      <Card as="section" padding="lg" aria-labelledby="profil-infos">
        <h2 id="profil-infos" className="mb-4 font-display text-xl font-bold">
          Nom et thème
        </h2>
        <ProfileForm name={user.name} preferredTheme={user.preferredTheme} />
      </Card>
      <Card as="section" padding="lg" aria-labelledby="profil-modules">
        <h2 id="profil-modules" className="mb-4 font-display text-xl font-bold">
          Modules
        </h2>
        <ModulesForm modules={user.modules} />
      </Card>
      <Card as="section" padding="lg" aria-labelledby="profil-mdp">
        <h2 id="profil-mdp" className="mb-4 font-display text-xl font-bold">
          Mot de passe
        </h2>
        <PasswordForm />
      </Card>
    </main>
  );
}
