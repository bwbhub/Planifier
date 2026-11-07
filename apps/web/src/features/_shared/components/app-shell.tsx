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
 * Pages de la barre, dans l'ordre. Aujourd'hui (`module: null`) est toujours là : ce n'est pas un module. Événements
 * n'y est pas encore : son entrée arrive avec son écran (pas de lien vers une page qui n'existe pas).
 */
const NAV_PAGES: readonly { module: AppModule | null; href: string; label: string }[] = [
  { module: null, href: ROUTES.home, label: NAV_LABELS.today },
  { module: "TODO", href: ROUTES.todo, label: MODULE_LABELS.TODO },
  { module: "AGENDA", href: ROUTES.agenda, label: MODULE_LABELS.AGENDA },
];

const MODULE_LINK = cn(
  // Mobile : barre basse. PC : pastilles dans le panneau latéral.
  "flex min-h-14 flex-1 items-center justify-center text-control font-semibold text-nav-off",
  "aria-[current=page]:text-nav-on",
  "sm:min-h-11 sm:flex-none sm:justify-start sm:rounded-pill sm:px-4 sm:text-ink sm:hover:bg-field",
  "sm:aria-[current=page]:bg-ink sm:aria-[current=page]:text-surface",
);

function isOn(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === href;
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
  /**
   * Le « + » (donné par la couche `app` : le cadre ne connaît aucun module). PC : en haut du panneau latéral ; mobile :
   * flottant au-dessus de la barre basse. Absent sur l'Agenda, qui a son propre bouton, tant que le « + » ne propose
   * pas aussi une entrée d'agenda.
   */
  create?: ReactNode;
  children: ReactNode;
}

/**
 * Cadre des pages connectées. PC : panneau latéral (logo, modules, Espaces, Profil). Mobile : en-tête (logo, Espaces,
 * Profil) et barre basse des modules. Un seul jeu de liens, mis en page par les classes responsives.
 */
export function AppShell({ modules, create, children }: AppShellProps) {
  const pathname = usePathname();
  const shown = NAV_PAGES.filter(({ module }) => module === null || modules.includes(module));

  return (
    <ToastProvider dismissLabel={COMMON_LABELS.close}>
      <div
        // `--nav-height` : hauteur de la barre basse mobile ; ce qui flotte au-dessus d'elle (messages, « + ») s'y cale.
        className="flex min-h-screen flex-col sm:flex-row [--nav-height:3.5rem] sm:[--nav-height:0px]"
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
          {create === undefined || isOn(pathname, ROUTES.agenda) ? null : (
            <div className={cn("fixed right-4 bottom-above-nav z-30", "sm:static sm:z-auto")}>
              {create}
            </div>
          )}
          <nav
            aria-label={NAV_LABELS.modules}
            className={cn(
              "fixed inset-x-0 bottom-0 z-30 flex bg-nav",
              "sm:static sm:z-auto sm:flex-col sm:gap-1 sm:bg-transparent",
            )}
          >
            {shown.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isOn(pathname, href) ? "page" : undefined}
                className={MODULE_LINK}
              >
                {label}
              </Link>
            ))}
          </nav>
          <nav aria-label={NAV_LABELS.account} className="flex gap-2 sm:mt-auto sm:flex-col">
            <AccountLink href={ROUTES.spaces} label={NAV_LABELS.spaces} pathname={pathname} />
            <AccountLink href={ROUTES.profile} label={NAV_LABELS.profile} pathname={pathname} />
          </nav>
        </header>
        <div className="flex min-w-0 flex-1 flex-col pb-14 sm:pb-0">{children}</div>
      </div>
    </ToastProvider>
  );
}
