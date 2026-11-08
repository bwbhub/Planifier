import type { Metadata } from "next";
import { PageHeader } from "@planifier/ui/components/page-header";
import { TitledSection } from "@planifier/ui/components/titled-section";
import { redirect } from "next/navigation";

import {
  ChangeEmailForm,
  getCurrentUser,
  LinkErrorNotice,
  ModulesForm,
  PasswordForm,
  ProfileForm,
  SignOutButton,
} from "@/features/account";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/labels";

export const metadata: Metadata = { title: pageTitle("Mon profil") };

export default async function ProfilePage({ searchParams }: PageProps<"/profil">) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 pb-10">
      <PageHeader title="Mon profil" subtitle={user.email} />
      {error === undefined ? null : (
        <LinkErrorNotice>
          Ce lien de changement d'adresse n'est plus valable. Demande-en un nouveau ci-dessous.
        </LinkErrorNotice>
      )}
      <TitledSection title="Nom et thème" padding="lg">
        <ProfileForm name={user.name} preferredTheme={user.preferredTheme} />
      </TitledSection>
      <TitledSection title="Modules" padding="lg">
        <ModulesForm modules={user.modules} />
      </TitledSection>
      <TitledSection title="Adresse e-mail" padding="lg">
        <ChangeEmailForm currentEmail={user.email} />
      </TitledSection>
      <TitledSection title="Mot de passe" padding="lg">
        <PasswordForm />
      </TitledSection>
      <TitledSection title="Session" padding="lg">
        <SignOutButton />
      </TitledSection>
    </main>
  );
}
