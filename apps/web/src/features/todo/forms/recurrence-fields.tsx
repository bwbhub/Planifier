"use client";

import { WEEKDAYS } from "@planifier/constants/days";
import { RECURRENCE_MAX_INTERVAL } from "@planifier/constants/todo";
import type { TaskOutput } from "@planifier/api-contract";
import { Checkbox } from "@planifier/ui/components/checkbox";
import { RecurrenceField } from "@planifier/ui/components/recurrence-field";
import { SelectField } from "@planifier/ui/components/select-field";
import { TextField } from "@planifier/ui/components/text-field";
import { useEffect, useRef, useState } from "react";

import { capitalized } from "@/lib/capitalize";
import { WEEKDAY_LABELS } from "@/lib/labels";

import {
  CUSTOM_FREQUENCY_OPTIONS,
  CUSTOM_REPEAT,
  REPEAT_PRESETS,
  repeatChoiceOf,
} from "../utils/recurrence";

const INTERVAL_ERROR = `Un nombre entier de 1 à ${String(RECURRENCE_MAX_INTERVAL)}.`;

const LABELS = {
  legend: "Répéter",
  custom: "Personnalisée…",
  frequency: "Rythme",
  interval: "Intervalle",
  intervalHint: "2 avec « Semaines » : toutes les deux semaines.",
  weekdays: "Jours de la semaine",
  weekdaysHint: "Facultatif : sans jour coché, la tâche suit son échéance.",
} as const;

type Recurrence = NonNullable<TaskOutput["recurrence"]>;

function WeekdayChoices({ rule }: { rule: Recurrence | null }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-semibold">{LABELS.weekdays}</legend>
      <div className="flex flex-wrap gap-x-4">
        {WEEKDAYS.map((day) => (
          <Checkbox
            key={day}
            label={capitalized(WEEKDAY_LABELS[day].one)}
            name="weekdays"
            value={day}
            defaultChecked={rule?.weekdays?.includes(day) ?? false}
          />
        ))}
      </div>
      <p className="text-sm text-muted">{LABELS.weekdaysHint}</p>
    </fieldset>
  );
}

interface CustomRecurrenceProps {
  rule: Recurrence | null;
  intervalInvalid: boolean;
}

/** Panneau de « Personnalisée… » : rythme, intervalle et, par semaines, jours. */
function CustomRecurrence({ rule, intervalInvalid }: CustomRecurrenceProps) {
  const [frequency, setFrequency] = useState(rule?.frequency ?? "WEEKLY");
  return (
    <div className="flex flex-col gap-3 rounded-control bg-field p-3">
      <SelectField
        label={LABELS.frequency}
        name="customFrequency"
        options={CUSTOM_FREQUENCY_OPTIONS}
        value={frequency}
        onChange={(event) => {
          const next = CUSTOM_FREQUENCY_OPTIONS.find(({ value }) => value === event.target.value);
          if (next !== undefined) setFrequency(next.value);
        }}
      />
      <TextField
        label={LABELS.interval}
        name="interval"
        type="number"
        inputMode="numeric"
        min={1}
        max={RECURRENCE_MAX_INTERVAL}
        defaultValue={rule?.interval ?? 1}
        hint={LABELS.intervalHint}
        error={intervalInvalid ? INTERVAL_ERROR : undefined}
      />
      {frequency === "WEEKLY" ? <WeekdayChoices rule={rule} /> : null}
    </div>
  );
}

interface RecurrenceFieldsProps {
  task: TaskOutput | undefined;
  intervalInvalid: boolean;
}

/**
 * Répétition (ADR 0017) du formulaire de tâche : préréglages, ou règle personnalisée (rythme, intervalle, jours).
 * Quand le formulaire se vide (saisie à la chaîne), le champ revient à son choix de départ : un `reset` du navigateur
 * ne le dit pas à React, qui garderait le panneau ouvert.
 */
export function RecurrenceFields({ task, intervalInvalid }: RecurrenceFieldsProps) {
  const rule = task?.recurrence ?? null;
  const anchor = useRef<HTMLDivElement>(null);
  const [resets, setResets] = useState(0);
  useEffect(() => {
    const form = anchor.current?.closest("form");
    const onReset = () => {
      setResets((count) => count + 1);
    };
    form?.addEventListener("reset", onReset);
    return () => {
      form?.removeEventListener("reset", onReset);
    };
  }, []);
  return (
    <div ref={anchor}>
      <RecurrenceField
        key={resets}
        legend={LABELS.legend}
        name="repeat"
        presets={REPEAT_PRESETS}
        custom={{ value: CUSTOM_REPEAT, label: LABELS.custom }}
        defaultValue={repeatChoiceOf(rule)}
      >
        <CustomRecurrence rule={rule} intervalInvalid={intervalInvalid} />
      </RecurrenceField>
    </div>
  );
}
