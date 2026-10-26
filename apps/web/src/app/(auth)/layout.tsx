import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/features/account";
import { ROUTES } from "@/lib/routes";

/** Connexion et inscription : inutiles avec une session ouverte. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user !== null) redirect(ROUTES.home);
  return children;
}
