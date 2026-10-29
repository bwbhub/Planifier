import { useState } from "react";

/** Ce qu'une ligne ou un en-tête montre : lui-même, son formulaire, ou la confirmation de suppression. */
export type InPlaceMode = "view" | "edit" | "confirmDelete";

/** Mode d'un élément modifiable sur place, et des rappels prêts à brancher sur les boutons. */
export function useInPlaceMode() {
  const [mode, setMode] = useState<InPlaceMode>("view");
  return {
    mode,
    showView: () => {
      setMode("view");
    },
    showEdit: () => {
      setMode("edit");
    },
    showConfirmDelete: () => {
      setMode("confirmDelete");
    },
  };
}
