"use client";

import { type ReactNode, useId, useLayoutEffect, useRef } from "react";

import { cn } from "../lib/cn";

export interface SheetProps {
  open: boolean;
  /** Fermeture demandée par l'utilisateur (Échap) : le parent repasse `open` à `false`. */
  onClose: () => void;
  title: string;
  /** Texte qui explique la décision, lu avec le titre à l'ouverture. */
  description?: ReactNode;
  /** `alertdialog` : confirmation d'une action définitive (le lecteur d'écran l'annonce comme une alerte). */
  role?: "dialog" | "alertdialog";
  /** Actions, empilées sur toute la largeur. */
  children: ReactNode;
  className?: string;
}

/**
 * Feuille modale sur voile sombre : en bas de l'écran sur mobile, centrée sur grand écran. `<dialog>` natif : le
 * focus reste dans la feuille, Échap la ferme, le reste de la page est inerte. Fermée ou retirée, elle rend le focus
 * à l'élément qui l'a ouverte.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  role = "dialog",
  children,
  className,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Effet de mise en page : son nettoyage passe avant que le parent retire la feuille du document.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog === null || !open) return;
    const opener = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      // Fermée ou démontée par le parent (« Annuler », succès) : le focus revient à ce qui l'a ouverte.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={description === undefined ? undefined : descriptionId}
      onClose={onClose}
      className={cn(
        "mx-4 w-auto max-w-md rounded-sheet bg-surface px-5 pt-6 pb-5 text-ink backdrop:bg-overlay",
        // Le reset de Tailwind annule la marge automatique du <dialog> : la position se pose ici.
        "max-sm:mt-auto max-sm:mb-6 sm:mx-auto sm:my-auto",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <h2 id={titleId} className="font-display text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {description === undefined ? null : (
          <div id={descriptionId} className="leading-relaxed">
            {description}
          </div>
        )}
        <div className="mt-1.5 flex flex-col gap-2">{children}</div>
      </div>
    </dialog>
  );
}
