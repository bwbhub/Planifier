import { LIST_TINTS, type ListTint } from "@planifier/constants/todo";

/** Une seule table par teinte : libellé et fond (token). Classes en entier pour que Tailwind les voie. */
export const TINTS: Record<ListTint, { label: string; background: string }> = {
  general: { label: "Général", background: "bg-tint-general" },
  work: { label: "Boulot", background: "bg-tint-work" },
  couple: { label: "Couple", background: "bg-tint-couple" },
  trip: { label: "Vacances", background: "bg-tint-trip" },
};

/** Choix de teinte du formulaire de liste, dans l'ordre de `LIST_TINTS`. */
export const TINT_OPTIONS = LIST_TINTS.map((value) => ({ value, label: TINTS[value].label }));
