import { cn } from "@planifier/ui/lib/cn";
import type { ReactNode } from "react";

import { BackLink } from "./back-link";

interface SpacePageProps {
  back?: { href: string; label: string };
  /** Titre de la page ; absent quand la vue porte le sien (en-tête d'un Espace). */
  title?: string;
  intro?: ReactNode;
  /** Deux colonnes sur grand écran. */
  wide?: boolean;
  children: ReactNode;
}

/** Cadre commun des pages des Espaces : colonne centrée, retour, titre. */
export function SpacePage({ back, title, intro, wide = false, children }: SpacePageProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pt-4 pb-10",
        wide && "lg:max-w-5xl",
      )}
    >
      {back === undefined ? null : <BackLink href={back.href} label={back.label} />}
      {title === undefined ? null : (
        <h1 className="mx-1 font-display text-4xl font-bold tracking-tight">{title}</h1>
      )}
      {intro === undefined ? null : <p className="mx-1 text-muted">{intro}</p>}
      {children}
    </main>
  );
}
