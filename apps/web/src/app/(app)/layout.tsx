import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { getCurrentUser } from "@/features/account";
import { AppShell } from "@/features/_shared/components/app-shell";
import { NewTaskLauncher } from "@/features/todo";
import { ROUTES } from "@/lib/routes";

/** Pages réservées aux comptes connectés : sans session, retour à la connexion. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);
  return (
    <AppShell
      modules={user.modules}
      create={
        user.modules.includes("TODO") ? (
          <Suspense>
            <NewTaskLauncher />
          </Suspense>
        ) : undefined
      }
    >
      {children}
    </AppShell>
  );
}
