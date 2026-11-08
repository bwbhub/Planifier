"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { hrefWithTask, markTaskOpenedInApp } from "./task-param";

/**
 * Ouvre le détail d'une tâche de n'importe quel écran : ajoute `?tache=<id>` à l'adresse courante (les autres
 * paramètres restent). La feuille est montée une fois pour toute l'application ; « retour » la ferme.
 */
export function useOpenTask(): (taskId: string) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (taskId) => {
    markTaskOpenedInApp();
    router.push(hrefWithTask(pathname, searchParams, taskId));
  };
}
