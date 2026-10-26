import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser, PasswordForm, ProfileForm } from "@/features/account";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Mon profil · Planifier" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-10">
      <div>
        <Link
          href={ROUTES.home}
          className="inline-flex min-h-11 items-center font-semibold text-accent-text underline"
        >
          Retour à l&apos;accueil
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="mt-2 text-muted">{user.email}</p>
      </div>
      <section aria-labelledby="profil-infos" className="rounded-card bg-surface px-6 py-8 sm:px-8">
        <h2 id="profil-infos" className="mb-4 font-display text-xl font-bold">
          Nom et thème
        </h2>
        <ProfileForm name={user.name} preferredTheme={user.preferredTheme} />
      </section>
      <section aria-labelledby="profil-mdp" className="rounded-card bg-surface px-6 py-8 sm:px-8">
        <h2 id="profil-mdp" className="mb-4 font-display text-xl font-bold">
          Mot de passe
        </h2>
        <PasswordForm />
      </section>
    </main>
  );
}
