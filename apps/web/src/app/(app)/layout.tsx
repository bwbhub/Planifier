import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/features/account";
import { AppHeader } from "@/features/_shared/components/app-header";
import { ROUTES } from "@/lib/routes";

/** Pages réservées aux comptes connectés : sans session, retour à la connexion. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      {children}
    </div>
  );
}
