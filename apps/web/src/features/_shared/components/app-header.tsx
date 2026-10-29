"use client";

import { buttonClassName } from "@planifier/ui/components/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/lib/routes";

/**
 * Barre du haut des pages connectées : retour à l'accueil, Espaces et profil en boutons à part. Provisoire : la
 * navigation des modules (barre latérale sur PC) les reprendra.
 */
export function AppHeader() {
  const pathname = usePathname();
  const onProfile = pathname === ROUTES.profile;
  const inSpaces = pathname === ROUTES.spaces || pathname.startsWith(`${ROUTES.spaces}/`);

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <Link
        href={ROUTES.home}
        className="inline-flex min-h-11 items-center font-display text-lg font-bold text-accent-text"
      >
        Planifier
      </Link>
      <nav aria-label="Espaces et profil" className="flex gap-2">
        <Link
          href={ROUTES.spaces}
          aria-current={inSpaces ? "page" : undefined}
          className={buttonClassName({ variant: "secondary", className: "px-5" })}
        >
          Espaces
        </Link>
        <Link
          href={ROUTES.profile}
          aria-current={onProfile ? "page" : undefined}
          className={buttonClassName({ variant: "secondary", className: "px-5" })}
        >
          Profil
        </Link>
      </nav>
    </header>
  );
}
