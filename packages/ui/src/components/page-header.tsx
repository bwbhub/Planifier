import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Titre de la page : l'unique `h1`. */
  title: string;
  /** Précision sous le titre (compte, date, sous-titre). */
  subtitle?: string;
  /** Actions de la page, à droite du titre (elles passent dessous quand la place manque). */
  actions?: ReactNode;
}

/** En-tête d'une page : titre, précision et actions. Sans métier. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight wrap-break-word">{title}</h1>
        {subtitle === undefined ? null : <p className="mt-2 text-muted">{subtitle}</p>}
      </div>
      {actions === undefined ? null : (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
