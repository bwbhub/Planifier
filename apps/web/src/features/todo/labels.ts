/** Chargement et états vides du module. */
export const TODO_LABELS = {
  loadingLists: "Chargement de tes listes…",
  loadingTasks: "Chargement des tâches…",
  noListTitle: "Aucune liste pour l'instant",
  createFirstList: "Créer ma première liste",
  loadingPeople: "Chargement des personnes…",
  noListHint: "Une liste réunit des tâches : courses, maison, vacances…",
  noTaskTitle: "Aucune tâche dans cette liste",
  noTaskHint: "Ajoute la première ci-dessus.",
  noTaskReadOnly: "Cette liste est en lecture seule.",
  addSubtask: "Ajouter une sous-tâche",
  finishForGood: "Terminer pour de bon",
  edit: "Modifier",
  delete: "Supprimer",
  actionsOf: (title: string) => `Actions de « ${title} »`,
  taskUpdated: "Tâche modifiée.",
  taskDeleted: "Tâche supprimée.",
} as const;
