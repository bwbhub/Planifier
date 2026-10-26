import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  intro: string;
  /** Lien vers l'autre écran (connexion ↔ inscription). */
  footer: ReactNode;
  children: ReactNode;
}

/** Cadre des écrans de connexion et d'inscription : une carte centrée, un seul objectif. */
export function AuthShell({ title, intro, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-sm rounded-card bg-surface px-6 py-8 sm:px-8">
        <p className="font-display text-lg font-bold text-accent-text">Planifier</p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted">{intro}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </section>
    </main>
  );
}
