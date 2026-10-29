import { ROUTES } from "@/lib/routes";

/** Lien vers l'écran Todo, sur une liste (`?liste=`) ou sur la première. */
export function listHref(listId: string | null): string {
  return listId === null ? ROUTES.todo : `${ROUTES.todo}?liste=${encodeURIComponent(listId)}`;
}
