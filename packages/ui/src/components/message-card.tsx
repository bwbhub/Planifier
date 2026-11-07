import type { ReactNode } from "react";

export interface MessageCardProps {
  /** Absent : le titre fait partie du contenu. */
  title?: string;
  /** `1` quand la carte est tout le contenu de la page ; `3` quand elle vient sous un titre de niveau 2. */
  level?: 1 | 2 | 3;
  children: ReactNode;
}

/** Carte centrée qui occupe l'écran : état vide, introuvable, message d'accueil. */
export function MessageCard({ title, level = 2, children }: MessageCardProps) {
  const HEADINGS = { 1: "h1", 2: "h2", 3: "h3" } as const;
  const Heading = HEADINGS[level];
  return (
    <section className="flex flex-col items-center gap-3.5 rounded-card bg-surface px-5.5 py-7 text-center">
      {title === undefined ? null : (
        <Heading className="font-display text-2xl font-bold tracking-tight">{title}</Heading>
      )}
      {children}
    </section>
  );
}
