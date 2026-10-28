import type { ReactNode } from "react";

export interface SettingRowProps {
  title: ReactNode;
  hint?: ReactNode;
  /** Élément à gauche (pastille). */
  leading?: ReactNode;
  /** Élément à droite (rôle, bouton). */
  children?: ReactNode;
}

/** Ligne d'une carte de réglages : titre, aide, action. Séparée de la suivante par un filet. */
export function SettingRow({ title, hint, leading, children }: SettingRowProps) {
  return (
    <li className="flex min-h-15 items-center gap-3 border-b border-line py-2 last:border-b-0">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="font-medium wrap-break-word">{title}</div>
        {hint === undefined ? null : <div className="mt-0.5 text-sm text-muted">{hint}</div>}
      </div>
      {children}
    </li>
  );
}

/** Carte qui regroupe des `SettingRow`. */
export function SettingCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="rounded-card bg-surface px-4.5 py-1.5">
      {children}
    </ul>
  );
}

/** Intertitre discret au-dessus d'une carte. */
export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mx-1.5 mt-2.5 text-sm font-semibold text-muted">
      {children}
    </h2>
  );
}
