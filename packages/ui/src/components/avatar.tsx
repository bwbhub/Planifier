import { cn } from "../lib/cn";

import { initialOf, tintOf } from "../lib/tint";

export interface AvatarProps {
  /** Identifiant stable (personne, groupe) : il fixe la teinte. */
  id: string;
  name: string;
  size?: "md" | "lg";
  /** Contour de la couleur du fond, quand les pastilles se chevauchent. */
  ringClassName?: string;
}

/** Pastille ronde à l'initiale, décorative : le nom est toujours écrit à côté ou dans le libellé du groupe. */
export function Avatar({ id, name, size = "md", ringClassName }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-pill font-semibold text-ink",
        size === "md" ? "size-10 text-sm" : "size-16 text-xl",
        tintOf(id).background,
        ringClassName,
      )}
    >
      {initialOf(name)}
    </span>
  );
}
