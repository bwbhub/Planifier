import type { ReactNode } from "react";

import { MessageCard } from "./message-card";

export interface EmptyStateProps {
  /** Ce qui manque, dit simplement : « Aucune liste pour l'instant ». */
  title: string;
  /** Ce que c'est et ce qu'on peut faire : une phrase utile, jamais « Rien à afficher ». */
  description: ReactNode;
  /** Le geste qui sort du vide (bouton ou lien), s'il y en a un. */
  action?: ReactNode;
  /** `1` quand l'état vide est tout le contenu de la page. */
  level?: 1 | 2;
}

/** État vide : un titre, une phrase utile et, si possible, l'action qui le remplit. Sans métier. */
export function EmptyState({ title, description, action, level }: EmptyStateProps) {
  return (
    <MessageCard title={title} {...(level === undefined ? {} : { level })}>
      <p className="leading-relaxed text-muted">{description}</p>
      {action}
    </MessageCard>
  );
}
