"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TASK_PARAM } from "@/lib/routes";

import { TaskDetailSheet } from "./task-detail-sheet";

/**
 * Monté une fois dans la mise en page : ouvre le détail quand l'adresse porte `?tache=<id>`, de n'importe quel écran.
 * Fermer retire le paramètre (les autres restent) sans ajouter d'entrée à l'historique.
 */
export function TaskDetailHost() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const taskId = searchParams.get(TASK_PARAM);
  if (taskId === null) return null;
  return (
    <TaskDetailSheet
      taskId={taskId}
      onClose={() => {
        const params = new URLSearchParams(searchParams);
        params.delete(TASK_PARAM);
        const query = params.toString();
        router.replace(query === "" ? pathname : `${pathname}?${query}`);
      }}
    />
  );
}
