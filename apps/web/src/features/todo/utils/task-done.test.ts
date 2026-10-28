import { describe, expect, it } from "vitest";

import { taskWith } from "../testing/task-fixtures";
import { withTaskDone } from "./task-done";

const NOW = new Date("2026-10-28T10:00:00Z");
const parent = taskWith({ id: "p", title: "Courses" });
const subtask = taskWith({ id: "s", title: "Pain", parentId: "p" });
const tasks = { items: [parent, subtask] };

describe("cocher (rendu optimiste)", () => {
  it("coche seulement la tâche visée, jamais ses sous-tâches, et compte une tâche à faire de moins", () => {
    const { tasks: next, delta } = withTaskDone(tasks, "p", true, NOW);
    expect(next.items).toEqual([{ ...parent, completedAt: NOW }, subtask]);
    expect(delta).toBe(-1);
  });

  it("ne change pas le compte de la liste pour une sous-tâche", () => {
    const { tasks: next, delta } = withTaskDone(tasks, "s", true, NOW);
    expect(next.items).toEqual([parent, { ...subtask, completedAt: NOW }]);
    expect(delta).toBe(0);
  });

  it("décocher rend une tâche à faire ; un état déjà atteint ne change rien", () => {
    const checked = { items: [{ ...parent, completedAt: NOW }, subtask] };
    expect(withTaskDone(checked, "p", false).delta).toBe(1);
    expect(withTaskDone(checked, "p", true)).toEqual({ tasks: checked, delta: 0 });
  });
});
