"use client";

import { useState } from "react";

import { TaskLine } from "./task-line";

const PEOPLE = { camille: { userId: "u-camille", name: "Camille" } } as const;

/** La ligne de tâche partagée dans chacun de ses états ; la première se coche, comme dans une liste. */
export function TaskLinesDemo() {
  const [done, setDone] = useState(false);
  return (
    <ul className="flex flex-col gap-2">
      <li className="rounded-control bg-field px-4 py-2">
        <TaskLine title="Appeler le garagiste" done={done} onToggle={setDone} />
      </li>
      <li className="rounded-control bg-field px-4 py-2">
        <TaskLine
          title="Préparer le week-end"
          done={false}
          onToggle={() => undefined}
          subtasks={{ done: 2, total: 4, label: "2 sur 4 sous-tâches cochées" }}
          details={<span className="text-sm text-muted">Pour le 3 juillet</span>}
        />
      </li>
      <li className="rounded-control bg-field px-4 py-2">
        <TaskLine
          title="Réserver le logement"
          done
          onToggle={() => undefined}
          assignee={PEOPLE.camille}
          completedByName="Camille"
        />
      </li>
      <li className="rounded-control bg-field px-4 py-2">
        <TaskLine
          title="Acheter les piles"
          done={false}
          onToggle={() => undefined}
          assignee={PEOPLE.camille}
          dimmed
        />
      </li>
      <li className="rounded-control bg-field px-4 py-2">
        <TaskLine title="Liste en lecture seule" done={false} />
      </li>
    </ul>
  );
}
