"use client";

import type { AppModule } from "@planifier/constants/spaces";
import { buttonClassName } from "@planifier/ui/components/button";
import { ToastProvider } from "@planifier/ui/components/toast";
import { cn } from "@planifier/ui/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { COMMON_LABELS, MODULE_LABELS, NAV_LABELS } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

/**
 * Modules qui ont un écran, dans l'ordre de la navigation. Événements n'y est pas encore : son entrée arrive avec
 * son écran (pas de lien vers une page qui n'existe pas).
 */
const MODULE_PAGES: readonly { module: AppModule; href: string }[] = [
  { module: "TODO", href: ROUTES.todo },
  { module: "AGENDA", href: ROUTES.agenda },
];

const MODULE_LINK = cn(
  // Mobile : barre basse. PC : pastilles dans le panneau latéral.
  "flex min-h-14 flex-1 items-center justify-center text-control font-semibold text-nav-off",
  "aria-[current=page]:text-nav-on",
  "sm:min-h-11 sm:flex-none sm:justify-start sm:rounded-pill sm:px-4 sm:text-ink sm:hover:bg-field",
  "sm:aria-[current=page]:bg-ink sm:aria-[current=page]:text-surface",
);

function isOn(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AccountLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  return (
    <Link
      href={href}
      aria-current={isOn(pathname, href) ? "page" : undefined}
      className={buttonClassName({
        variant: "secondary",
        className:
          "px-5 sm:justify-start aria-[current=page]:bg-ink aria-[current=page]:text-surface",
      })}
    >
      {label}
    </Link>
  );
}

interface AppShellProps {
  /** Modules activés par l'utilisateur : la navigation n'en montre pas d'autres. */
  modules: readonly AppModule[];
  children: ReactNode;
}

/**
 * Cadre des pages connectées. PC : panneau latéral (logo, modules, Espaces, Profil). Mobile : en-tête (logo, Espaces,
 * Profil) et barre basse des modules. Un seul jeu de liens, mis en page par les classes responsives.
 */
export function AppShell({ modules, children }: AppShellProps) {
  const pathname = usePathname();
  const shown = MODULE_PAGES.filter(({ module }) => modules.includes(module));

  return (
    <ToastProvider dismissLabel={COMMON_LABELS.close}>
      <div
        className={cn(
          "flex min-h-screen flex-col sm:flex-row",
          // Hauteur de la barre basse mobile : ce qui flotte au-dessus d'elle (messages, bouton « + ») s'y cale.
          shown.length > 0 && "[--nav-height:3.5rem] sm:[--nav-height:0px]",
        )}
      >
        <header
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3",
            "sm:sticky sm:top-0 sm:h-screen sm:w-60 sm:shrink-0 sm:flex-col sm:flex-nowrap sm:items-stretch",
            "sm:justify-start sm:gap-6 sm:px-4 sm:py-6",
          )}
        >
          <Link
            href={ROUTES.home}
            className="inline-flex min-h-11 items-center font-display text-lg font-bold text-accent-text"
          >
            {COMMON_LABELS.appName}
          </Link>
          {shown.length === 0 ? null : (
            <nav
              aria-label={NAV_LABELS.modules}
              className={cn(
                "fixed inset-x-0 bottom-0 z-30 flex bg-nav",
                "sm:static sm:z-auto sm:flex-col sm:gap-1 sm:bg-transparent",
              )}
            >
              {shown.map(({ module, href }) => (
                <Link
                  key={module}
                  href={href}
                  aria-current={isOn(pathname, href) ? "page" : undefined}
                  className={MODULE_LINK}
                >
                  {MODULE_LABELS[module]}
                </Link>
              ))}
            </nav>
          )}
          <nav aria-label={NAV_LABELS.account} className="flex gap-2 sm:mt-auto sm:flex-col">
            <AccountLink href={ROUTES.spaces} label={NAV_LABELS.spaces} pathname={pathname} />
            <AccountLink href={ROUTES.profile} label={NAV_LABELS.profile} pathname={pathname} />
          </nav>
        </header>
        <div className={cn("flex min-w-0 flex-1 flex-col", shown.length > 0 && "pb-14 sm:pb-0")}>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
