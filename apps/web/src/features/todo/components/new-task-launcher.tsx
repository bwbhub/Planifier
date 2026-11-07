"use client";

import { Button } from "@planifier/ui/components/button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { TODO_LABELS } from "../labels";
import { NewTaskSheet } from "./new-task-sheet";

/** Le « + » : ouvre « Nouvelle tâche » de n'importe où ; sur `/todo?liste=`, la liste regardée est proposée d'abord. */
export function NewTaskLauncher() {
  const [open, setOpen] = useState(false);
  const openListId = useSearchParams().get("liste");
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        className="max-sm:size-14 max-sm:rounded-full max-sm:px-0 max-sm:text-2xl sm:w-full"
      >
        <span aria-hidden="true">+</span>
        <span className="sr-only sm:not-sr-only sm:ml-2">{TODO_LABELS.newTask}</span>
      </Button>
      <NewTaskSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        openListId={openListId}
      />
    </>
  );
}
