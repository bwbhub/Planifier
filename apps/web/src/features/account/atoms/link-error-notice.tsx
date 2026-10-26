import type { ReactNode } from "react";

/** Lien d'e-mail qui ne vaut plus rien (expiré, déjà servi), signalé en haut de la page où il ramène. */
export function LinkErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mb-4 rounded-control bg-accent-tint px-4 py-3 text-sm text-ink">
      {children}
    </p>
  );
}
