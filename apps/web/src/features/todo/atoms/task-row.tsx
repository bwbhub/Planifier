"use client";

import type { TaskOutput } from "@planifier/api-contract";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { Menu, type MenuItemSpec } from "@planifier/ui/components/menu";
import { useState } from "react";

import { TaskForm } from "../forms/task-form";
import { TODO_LABELS } from "../labels";
import { useDeleteTask } from "../queries/todo.queries";
import { useListView } from "../utils/list-view";
import { deleteQuestion, isSubtask, subtaskProgress } from "../utils/subtasks";
import { useInPlaceMode } from "../utils/use-in-place-mode";
import { DueDate } from "./due-date";
import { useOpenTask } from "@/features/_shared/utils/use-open-task";
import { TaskLine } from "@/features/_shared/components/task-line";
import { recurrenceLabel } from "@/features/_shared/utils/recurrence-label";
import { TodoErrorAlert } from "./todo-error-alert";

/**
 * Gestes de complétion d'une tâche, au geste de l'utilisateur seulement ; erreur et annonce s'affichent dans la liste.
 * `toggle` : cocher ou décocher (tâche répétée : occurrence faite) ; `finish` : terminer pour de bon une tâche répétée.
 */
export interface TaskCompletion {
  toggle: (task: TaskOutput, done: boolean) => void;
  finish: (task: TaskOutput) => void;
}

interface SubtasksProps {
  task: TaskOutput;
  subtasks: readonly TaskOutput[];
  adding: boolean;
  completion: TaskCompletion;
  onStopAdding: () => void;
}

/** Sous-tâches d'une tâche, cochées une à une (rien ne se coche en cascade), et leur ajout sur place. */
function Subtasks({ task, subtasks, adding, completion, onStopAdding }: SubtasksProps) {
  if (subtasks.length === 0 && !adding) return null;
  return (
    <div className="flex flex-col gap-2 pl-8">
      {subtasks.length === 0 ? null : (
        <ul
          className="flex flex-col gap-1 border-l-2 border-line pl-3"
          aria-label={`Sous-tâches de « ${task.title} »`}
        >
          {subtasks.map((subtask) => (
            <TaskRow key={subtask.id} task={subtask} completion={completion} />
          ))}
        </ul>
      )}
      {adding ? <TaskForm listId={task.listId} parentId={task.id} onDone={onStopAdding} /> : null}
    </div>
  );
}

/** Échéance, répétition et description : ce qui précise la tâche sous son titre. */
function TaskDetails({ task, done }: { task: TaskOutput; done: boolean }) {
  return (
    <>
      <DueDate task={task} done={done} />
      {task.recurrence === null ? null : (
        <span className="text-sm text-muted">{recurrenceLabel(task.recurrence)}</span>
      )}
      {task.description === null ? null : (
        <span className="text-sm whitespace-pre-line text-muted">{task.description}</span>
      )}
    </>
  );
}

interface TaskActionsProps {
  task: TaskOutput;
  done: boolean;
  onAddSubtask: () => void;
  onFinish: TaskCompletion["finish"];
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Menu d'actions d'une tâche, nommé avec son titre pour les lecteurs d'écran. Sous-tâche : pas d'ajout, un seul
 * niveau. « Terminer » : tâche répétée à faire seulement.
 */
function TaskActions({ task, done, onAddSubtask, onFinish, onEdit, onDelete }: TaskActionsProps) {
  const items: MenuItemSpec[] = [
    ...(isSubtask(task)
      ? []
      : [{ key: "subtask", label: TODO_LABELS.addSubtask, onSelect: onAddSubtask }]),
    ...(task.recurrence === null || done
      ? []
      : [
          {
            key: "finish",
            label: TODO_LABELS.finishForGood,
            onSelect: () => {
              onFinish(task);
            },
          },
        ]),
    { key: "edit", label: TODO_LABELS.edit, onSelect: onEdit },
    { key: "delete", label: TODO_LABELS.delete, onSelect: onDelete },
  ];
  return (
    <div className="flex justify-end sm:shrink-0">
      <Menu
        label={TODO_LABELS.actionsOf(task.title)}
        trigger={<span aria-hidden="true">⋯</span>}
        items={items}
      />
    </div>
  );
}

interface TodoTaskLineProps {
  task: TaskOutput;
  subtasks: readonly TaskOutput[];
  completion: TaskCompletion;
  /** Les actions de la tâche (hors modification et confirmation de suppression), jamais en lecture seule. */
  showActions: boolean;
  onAddSubtask: () => void;
  onDelete: () => void;
}

/** La ligne partagée (`TaskLine`) branchée sur le Todo : coche, atténuation, personnes, actions de la tâche. */
function TodoTaskLine({
  task,
  subtasks,
  completion,
  showActions,
  onAddSubtask,
  onDelete,
}: TodoTaskLineProps) {
  const { isDimmed, readOnly, shared } = useListView();
  const openTask = useOpenTask();
  const done = task.completedAt !== null;
  return (
    <TaskLine
      title={task.title}
      done={done}
      onToggle={
        readOnly
          ? undefined
          : (checked) => {
              completion.toggle(task, checked);
            }
      }
      onOpen={() => {
        openTask(task.id);
      }}
      dimmed={isDimmed(task)}
      subtasks={subtasks.length === 0 ? undefined : subtaskProgress(subtasks)}
      assignee={task.assignee}
      completedByName={shared && done ? task.completedBy?.name : undefined}
      details={<TaskDetails task={task} done={done} />}
      actions={
        showActions && !readOnly ? (
          <TaskActions
            task={task}
            done={done}
            onAddSubtask={onAddSubtask}
            onFinish={completion.finish}
            onEdit={() => {
              openTask(task.id);
            }}
            onDelete={onDelete}
          />
        ) : null
      }
    />
  );
}

interface TaskRowProps {
  task: TaskOutput;
  /** Sous-tâches de `task` ; absent pour une sous-tâche (un seul niveau). */
  subtasks?: readonly TaskOutput[];
  completion: TaskCompletion;
}

/**
 * Une tâche : case à cocher, échéance, description, sous-tâches ; suppression sur place, modification dans le détail. Lecture
 * seule : la coche montre l'état, sans geste possible.
 */
export function TaskRow({ task, subtasks = [], completion }: TaskRowProps) {
  const { mode, showView, showConfirmDelete } = useInPlaceMode();
  const [addingSubtask, setAddingSubtask] = useState(false);
  const deleteTask = useDeleteTask();
  const subtaskList = (
    <Subtasks
      task={task}
      subtasks={subtasks}
      adding={addingSubtask}
      completion={completion}
      onStopAdding={() => {
        setAddingSubtask(false);
      }}
    />
  );

  return (
    <li
      className={
        isSubtask(task)
          ? "flex flex-col gap-1"
          : "flex flex-col gap-2 rounded-control bg-surface px-4 py-3"
      }
    >
      <TodoTaskLine
        task={task}
        subtasks={subtasks}
        completion={completion}
        showActions={mode === "view"}
        onAddSubtask={() => {
          setAddingSubtask(true);
        }}
        onDelete={showConfirmDelete}
      />
      {mode === "confirmDelete" ? (
        <ConfirmPanel
          question={deleteQuestion(task.title, subtasks.length)}
          confirmLabel="Supprimer définitivement"
          keepLabel="Garder la tâche"
          pending={deleteTask.isPending}
          onConfirm={() => {
            deleteTask.mutate({ taskId: task.id });
          }}
          onKeep={showView}
        />
      ) : null}
      {deleteTask.isError ? <TodoErrorAlert error={deleteTask.error} /> : null}
      {subtaskList}
    </li>
  );
}
