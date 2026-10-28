import type { ReactNode } from "react";

interface MessageCardProps {
  /** Absent : le titre fait partie du contenu (aperçu d'invitation). */
  title?: string;
  /** `1` quand la carte est tout le contenu de la page. */
  level?: 1 | 2;
  children: ReactNode;
}

/** Carte centrée qui occupe l'écran : état vide, introuvable, invitation. */
export function MessageCard({ title, level = 2, children }: MessageCardProps) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section className="flex flex-col items-center gap-3.5 rounded-card bg-surface px-5.5 py-7 text-center">
      {title === undefined ? null : (
        <Heading className="font-display text-2xl font-bold tracking-tight">{title}</Heading>
      )}
      {children}
    </section>
  );
}
