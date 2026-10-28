import type { Db } from "../factory";
import { SEED_IDS } from "./ids";

/** Deux listes perso d'Alice, quelques tâches dont une cochée et une avec échéance. */
export async function seedTodo(db: Db) {
  const lists = [
    { id: SEED_IDS.listHome, name: "Maison", tint: "general" },
    { id: SEED_IDS.listTrip, name: "Vacances", tint: "trip" },
  ];
  for (const list of lists) {
    await db.todoList.upsert({
      where: { id: list.id },
      create: { ...list, ownerId: SEED_IDS.alice },
      update: { name: list.name, tint: list.tint },
    });
  }

  const tasks = [
    { id: SEED_IDS.taskGroceries, listId: SEED_IDS.listHome, title: "Faire les courses" },
    {
      id: SEED_IDS.taskPlants,
      listId: SEED_IDS.listHome,
      title: "Arroser les plantes",
      completedAt: new Date("2026-10-20T08:00:00Z"),
    },
    {
      id: SEED_IDS.taskBill,
      listId: SEED_IDS.listHome,
      title: "Payer la facture d'électricité",
      dueDate: new Date("2026-11-05"),
    },
    {
      id: SEED_IDS.taskTickets,
      listId: SEED_IDS.listTrip,
      title: "Réserver les billets de train",
      description: "Aller le vendredi soir si possible.",
    },
  ];
  // La liste n'est écrite qu'à la création : une tâche ne change pas de liste.
  for (const { id, listId, ...fields } of tasks) {
    await db.task.upsert({ where: { id }, create: { id, listId, ...fields }, update: fields });
  }
}
