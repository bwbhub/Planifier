"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { consumeTaskOpenedInApp, hrefWithTask } from "@/features/_shared/utils/task-param";
import { TASK_PARAM } from "@/lib/routes";

import { TaskDetailSheet } from "./task-detail-sheet";

/**
 * Monté une fois dans la mise en page : ouvre le détail quand l'adresse porte `?tache=<id>`, de n'importe quel écran.
 * Fermer revient en arrière si le détail s'est ouvert depuis l'application (« retour » et Échap font alors la même
 * chose), sinon retire le paramètre (lien profond) sans ajouter d'entrée à l'historique.
 */
export function TaskDetailHost() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const taskId = searchParams.get(TASK_PARAM);
  // Fermé par « retour » du navigateur : l'ouverture est consommée, la prochaine repart de zéro.
  useEffect(() => {
    if (taskId === null) consumeTaskOpenedInApp();
  }, [taskId]);
  if (taskId === null) return null;
  return (
    <TaskDetailSheet
      taskId={taskId}
      onClose={() => {
        if (consumeTaskOpenedInApp()) router.back();
        else router.replace(hrefWithTask(pathname, searchParams, null));
      }}
    />
  );
}
