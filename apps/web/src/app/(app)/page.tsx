import { buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser, SignOutButton } from "@/features/account";
import { ROUTES } from "@/lib/routes";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <section className="w-full max-w-sm rounded-card bg-surface px-6 py-10 text-center sm:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Bonjour {user.name}</h1>
        <p className="mt-2 text-muted">Tes listes de tâches t&apos;attendent.</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href={ROUTES.todo} className={buttonClassName()}>
            Ouvrir mes listes
          </Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
