"use client";

import { buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/lib/routes";

/**
 * Barre du haut des pages connectées : retour à l'accueil, navigation des modules (Todo pour l'instant), et le profil
 * en bouton à part.
 */
export function AppHeader() {
  const pathname = usePathname();
  const onProfile = pathname === ROUTES.profile;
  const onTodo = pathname === ROUTES.todo;

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <Link
        href={ROUTES.home}
        className="inline-flex min-h-11 items-center font-display text-lg font-bold text-accent-text"
      >
        Planifier
      </Link>
      <nav aria-label="Modules" className="flex-1">
        <Link
          href={ROUTES.todo}
          aria-current={onTodo ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-pill px-4 text-control font-semibold hover:bg-field aria-[current=page]:bg-ink aria-[current=page]:text-surface"
        >
          Todo
        </Link>
      </nav>
      <nav aria-label="Compte">
        <Link
          href={ROUTES.profile}
          aria-current={onProfile ? "page" : undefined}
          className={buttonClassName("secondary", "px-5")}
        >
          Profil
        </Link>
      </nav>
    </header>
  );
}
