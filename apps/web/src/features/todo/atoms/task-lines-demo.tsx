"use client";

import { type ReactNode, useState } from "react";

import { TaskLine } from "./task-line";

const CAMILLE = { userId: "u-camille", name: "Camille" };

function Row({ children }: { children: ReactNode }) {
  return <li className="rounded-control bg-field px-4 py-2">{children}</li>;
}

/** La ligne de tâche dans chacun de ses états ; la première se coche, comme dans une liste. */
export function TaskLinesDemo() {
  const [done, setDone] = useState(false);
  return (
    <ul className="flex flex-col gap-2">
      <Row>
        <TaskLine title="Appeler le garagiste" done={done} onToggle={setDone} />
      </Row>
      <Row>
        <TaskLine
          title="Préparer le week-end"
          done={false}
          onToggle={() => undefined}
          subtasks={{ done: 2, total: 4, label: "2 sur 4 sous-tâches cochées" }}
          details={<span className="text-sm text-muted">Pour le 3 juillet</span>}
        />
      </Row>
      <Row>
        <TaskLine
          title="Réserver le logement"
          done
          onToggle={() => undefined}
          assignee={CAMILLE}
          completedByName="Camille"
        />
      </Row>
      <Row>
        <TaskLine
          title="Acheter les piles"
          done={false}
          onToggle={() => undefined}
          assignee={CAMILLE}
          dimmed
        />
      </Row>
      <Row>
        <TaskLine title="Liste en lecture seule" done={false} />
      </Row>
    </ul>
  );
}
