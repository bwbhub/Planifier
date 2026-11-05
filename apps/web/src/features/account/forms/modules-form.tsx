"use client";

import { MODULES, type AppModule } from "@planifier/constants/spaces";
import { Button } from "@planifier/ui/components/button";
import { Switch } from "@planifier/ui/components/switch";
import type { SubmitEvent } from "react";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useSetModules } from "../queries/auth.queries";
import { COMMON_LABELS, MODULE_LABELS } from "@/lib/labels";

const HINTS: Record<AppModule, string> = {
  TODO: "Tes listes de tâches.",
  AGENDA: "Ton agenda, jour par jour.",
  EVENTS: "Les sorties et rendez-vous à plusieurs.",
};

interface ModulesFormProps {
  modules: readonly AppModule[];
}

/** Modules de l'espace personnel : seuls ceux qui sont allumés apparaissent dans la navigation. */
export function ModulesForm({ modules }: ModulesFormProps) {
  const setModules = useSetModules();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setModules.mutate({ modules: MODULES.filter((module) => data.has(module)) });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {MODULES.map((module) => (
        <Switch
          key={module}
          name={module}
          label={MODULE_LABELS[module]}
          hint={HINTS[module]}
          defaultChecked={modules.includes(module)}
        />
      ))}
      {setModules.isError ? <AuthErrorAlert error={setModules.error} /> : null}
      {setModules.isSuccess ? (
        <p role="status" className="text-sm text-muted">
          C&apos;est enregistré.
        </p>
      ) : null}
      <Button type="submit" loading={setModules.isPending} className="mt-2">
        {setModules.isPending ? COMMON_LABELS.saving : COMMON_LABELS.save}
      </Button>
    </form>
  );
}
