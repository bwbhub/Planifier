import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/features/account";
import { ROUTES } from "@/lib/routes";

/** Pages réservées aux comptes connectés : sans session, retour à la connexion. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);
  return children;
}
