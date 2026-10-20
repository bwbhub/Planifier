"use client";

import { Button } from "@planifier/ui/components/button";

/**
 * Erreur inattendue d'un écran (API injoignable pendant le rendu serveur, par exemple) : message sans détail
 * technique et reprise. Le détail reste dans les journaux du serveur.
 */
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section
        role="alert"
        className="w-full max-w-sm rounded-card bg-surface px-6 py-10 text-center sm:px-8"
      >
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Cette page n'a pas pu s'afficher
        </h1>
        <p className="mt-2 text-muted">
          Le service ne répond pas pour l'instant. Réessaie dans un instant.
        </p>
        <Button className="mt-6" onClick={retry}>
          Réessayer
        </Button>
      </section>
    </main>
  );
}
