"use client";

import type { GetTaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { SelectField } from "@planifier/ui/components/select-field";
import { type SubmitEvent, useState } from "react";

import { TodoErrorAlert } from "../atoms/todo-error-alert";
import { TODO_LABELS } from "../labels";
import { useMoveTask } from "../queries/todo.queries";
import { writableLists } from "../utils/new-task-list";
import { useAllLists } from "../utils/use-all-lists";

interface MoveTaskProps {
  detail: GetTaskOutput;
  onMoved: () => void;
}

/**
 * « Envoyer vers une autre liste » : la tâche et ses sous-tâches changent de liste, au geste de l'utilisateur. Seules
 * les listes où l'on écrit sont proposées. Une sous-tâche suit sa tâche : rien à proposer pour elle.
 */
export function MoveTask({ detail, onMoved }: MoveTaskProps) {
  const { task, list } = detail;
  const { items, loading } = useAllLists();
  const targets = writableLists(items).filter(({ id }) => id !== list.id);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const move = useMoveTask();
  const target = targets.find(({ id }) => id === chosenId) ?? targets[0];
  if (target === undefined || task.parentId !== null) return null;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (target === undefined) return;
    const sent = await move.send(task, list, target);
    if (sent) onMoved();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      aria-label={TODO_LABELS.moveTitle}
      className="flex flex-col gap-2"
    >
      <SelectField
        label={TODO_LABELS.moveTo}
        value={target.id}
        options={targets.map(({ id, name }) => ({ value: id, label: name }))}
        onChange={(event) => {
          setChosenId(event.target.value);
        }}
      />
      {move.error === null ? null : <TodoErrorAlert error={move.error} />}
      <div>
        <Button type="submit" variant="secondary" disabled={move.isPending || loading}>
          {TODO_LABELS.move}
        </Button>
      </div>
    </form>
  );
}
