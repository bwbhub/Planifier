import { redirect } from "next/navigation";

import { getCurrentUser, SignOutButton } from "@/features/account";
import { ApiStatus } from "@/features/_shared/components/api-status";
import { ROUTES } from "@/lib/routes";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-sm rounded-card bg-surface px-6 py-10 text-center sm:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Bonjour {user.name}</h1>
        <p className="mt-2 text-muted">Ton espace est en cours de construction.</p>
        <ApiStatus />
        <div className="mt-6">
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
