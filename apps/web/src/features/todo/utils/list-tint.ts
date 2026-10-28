import type { ListTint } from "@planifier/constants/todo";

/** Libellés et classes (tokens) des teintes de liste ; classes écrites en entier pour que Tailwind les voie. */
export const TINT_OPTIONS = [
  { value: "general", label: "Général" },
  { value: "work", label: "Boulot" },
  { value: "couple", label: "Couple" },
  { value: "trip", label: "Vacances" },
] as const satisfies readonly { value: ListTint; label: string }[];

export const TINT_BACKGROUND: Record<ListTint, string> = {
  general: "bg-tint-general",
  work: "bg-tint-work",
  couple: "bg-tint-couple",
  trip: "bg-tint-trip",
};
