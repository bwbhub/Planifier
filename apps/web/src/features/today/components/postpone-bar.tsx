"use client";

import type { TodayTaskOutput } from "@planifier/api-contract";
import { Button } from "@planifier/ui/components/button";
import { Checkbox } from "@planifier/ui/components/checkbox";
import { TextField } from "@planifier/ui/components/text-field";
import { useState } from "react";

import { TODAY_LABELS } from "../labels";
import type { PostponeInput } from "../queries/today.queries";

interface PostponeBarProps {
  tasks: readonly TodayTaskOutput[];
  day: string;
  pending: boolean;
  onPostpone: (input: PostponeInput) => void;
}

/**
 * « Les reporter à aujourd'hui » : au clic seulement, jamais d'office. Case « Proposer un nouvel horaire » : une heure
 * pour tout le lot ; sans elle, les tâches reportées n'ont pas d'heure.
 */
export function PostponeBar({ tasks, day, pending, onPostpone }: PostponeBarProps) {
  const [proposeTime, setProposeTime] = useState(false);
  const [time, setTime] = useState("");
  const timeIsMissing = proposeTime && time === "";
  return (
    <div className="mt-3 flex flex-col items-start gap-2">
      <Checkbox
        label={TODAY_LABELS.proposeNewTime}
        checked={proposeTime}
        onChange={(event) => {
          setProposeTime(event.target.checked);
        }}
      />
      {proposeTime ? (
        <TextField
          type="time"
          label={TODAY_LABELS.newTime}
          value={time}
          onChange={(event) => {
            setTime(event.target.value);
          }}
        />
      ) : null}
      <Button
        disabled={pending || timeIsMissing}
        onClick={() => {
          onPostpone({ tasks, date: day, time: proposeTime ? time : undefined });
        }}
      >
        {TODAY_LABELS.postpone}
      </Button>
    </div>
  );
}
