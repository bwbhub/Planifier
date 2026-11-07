import type { TodayTaskOutput, TodayTasksOutput } from "@planifier/api-contract";
import { dayToUtcDate } from "@planifier/constants/days";
import { isListTint, TODAY_SECTION_MAX } from "@planifier/constants/todo";
import type { Db, Prisma } from "@planifier/db";

import { TASK_SELECT, toTaskOutput } from "./tasks.service";

const TODAY_SELECT = {
  ...TASK_SELECT,
  list: { select: { id: true, name: true, tint: true } },
} as const satisfies Prisma.TaskSelect;

type TodayRow = Prisma.TaskGetPayload<{ select: typeof TODAY_SELECT }>;

/**
 * À faire et à moi : tâches de mes listes perso, et tâches qui me sont assignées dans une liste dont je suis membre de
 * l'Espace. Les listes montrées en lecture seule (celles des autres) n'y sont pas : ce ne sont pas mes tâches. Cochées et
 * sous-tâches exclues.
 */
function mine(userId: string): Prisma.TaskWhereInput {
  return {
    parentId: null,
    completedAt: null,
    OR: [
      { list: { ownerId: userId, spaceId: null } },
      { assigneeId: userId, list: { space: { members: { some: { userId } } } } },
    ],
  };
}

function toTodayTask(userId: string, { list, ...row }: TodayRow): TodayTaskOutput {
  // Chaîne libre en base : une valeur inconnue est une donnée corrompue, pas une entrée à deviner.
  if (!isListTint(list.tint))
    throw new Error(`Teinte de liste inconnue en base (liste ${list.id}).`);
  // L'assigné rendu n'est que moi (membre de l'Espace, vérifié par `mine`) ou personne.
  return { ...toTaskOutput(row, new Set([userId])), list: { ...list, tint: list.tint } };
}

async function section(
  db: Db,
  userId: string,
  filter: Prisma.TaskWhereInput,
  orderBy: Prisma.TaskOrderByWithRelationInput[],
) {
  const where: Prisma.TaskWhereInput = { AND: [mine(userId), filter] };
  const [rows, total] = await Promise.all([
    db.task.findMany({ where, orderBy, take: TODAY_SECTION_MAX, select: TODAY_SELECT }),
    db.task.count({ where }),
  ]);
  return { items: rows.map((row) => toTodayTask(userId, row)), total };
}

/** `date` : jour de l'appareil. Aucun contrôle de liste écrit ici : la requête ne lit que ce qui est à l'appelant. */
export async function todayTasks(db: Db, userId: string, date: string): Promise<TodayTasksOutput> {
  const day = dayToUtcDate(date);
  const [dueToday, ongoing, overdue] = await Promise.all([
    section(db, userId, { dueDate: day }, [
      { dueTime: { sort: "asc", nulls: "last" } },
      { id: "asc" },
    ]),
    section(db, userId, { dueDate: null }, [{ id: "asc" }]),
    section(db, userId, { dueDate: { lt: day } }, [{ dueDate: "asc" }, { id: "asc" }]),
  ]);
  return { dueToday, ongoing, overdue };
}
