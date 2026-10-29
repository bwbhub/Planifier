import { describe, expect, it } from "vitest";

import { taskWith } from "../testing/task-fixtures";
import { deleteQuestion, isSubtask, subtaskCountLabel, subtasksByParent } from "./subtasks";

const DONE = new Date("2026-10-28T10:00:00Z");
const parent = taskWith({ id: "p", title: "Courses" });
const bread = taskWith({ id: "a", title: "Pain", parentId: "p" });
const milk = taskWith({ id: "b", title: "Lait", parentId: "p", completedAt: DONE });

describe("sous-tâches", () => {
  it("reconnaît une sous-tâche à son parent", () => {
    expect(isSubtask(parent)).toBe(false);
    expect(isSubtask(bread)).toBe(true);
  });

  it("regroupe les sous-tâches par parent, dans l'ordre reçu, sans les tâches de la liste", () => {
    const other = taskWith({ id: "c", title: "Œufs", parentId: "q" });
    const byParent = subtasksByParent([parent, bread, other, milk]);
    expect(byParent.get("p")).toEqual([bread, milk]);
    expect(byParent.get("q")).toEqual([other]);
    expect(byParent.has("a")).toBe(false);
  });

  it("compte les sous-tâches cochées, accordé au nombre", () => {
    expect(subtaskCountLabel([bread])).toBe("0 sur 1 sous-tâche cochée");
    expect(subtaskCountLabel([bread, milk])).toBe("1 sur 2 sous-tâches cochée");
    expect(subtaskCountLabel([milk, { ...bread, completedAt: DONE }])).toBe(
      "2 sur 2 sous-tâches cochées",
    );
  });

  it("nomme les sous-tâches qui partent avec la tâche supprimée", () => {
    expect(deleteQuestion("Courses", 0)).toBe("Supprimer « Courses » ?");
    expect(deleteQuestion("Courses", 1)).toBe("Supprimer « Courses » et sa sous-tâche ?");
    expect(deleteQuestion("Courses", 3)).toBe("Supprimer « Courses » et ses 3 sous-tâches ?");
  });
});
