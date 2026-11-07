"use client";

import { useState } from "react";

import { cn } from "../lib/cn";
import { Checkbox } from "./checkbox";
import { TextField } from "./text-field";

/** Jour (`AAAA-MM-JJ`) et heure (`HH:MM`) ; `null` : vide. Heure vide, affichée ou non : `time` est `null`. */
export interface DateTimeValue {
  date: string | null;
  time: string | null;
}

export interface DateTimeFieldProps {
  /** Libellé du champ jour. */
  label: string;
  /** Libellé du champ heure, qui n'apparaît que si l'heure compte. */
  timeLabel: string;
  /** Libellé de la case qui masque l'heure : « Sans heure ». */
  noTimeLabel: string;
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  /**
   * Noms pour `FormData`. Un champ vide part en chaîne vide ; le champ heure n'existe pas (rien n'est envoyé) tant que
   * « Sans heure » est cochée.
   */
  dateName?: string | undefined;
  timeName?: string | undefined;
  hint?: string | undefined;
  /** Erreur : marque le jour invalide et s'annonce avec lui. */
  error?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Jour et heure facultative. Le jour est un `<input type="date">` natif (clavier, lecteurs d'écran et mobile corrects,
 * sans dépendance) ; l'heure, un `<input type="time">`, n'apparaît que si « Sans heure » est décochée. Cocher « Sans
 * heure » efface l'heure. Contrôlé : l'appelant garde la valeur.
 */
export function DateTimeField({
  label,
  timeLabel,
  noTimeLabel,
  value,
  onChange,
  dateName,
  timeName,
  hint,
  error,
  disabled,
  className,
}: DateTimeFieldProps) {
  // La case seule décide si le champ heure est montré : une heure vide ne le referme pas, l'appelant ne voit que `null`.
  const [timeShown, setTimeShown] = useState(value.time !== null);
  const withoutTime = !timeShown && value.time === null;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <TextField
        label={label}
        type="date"
        name={dateName}
        value={value.date ?? ""}
        hint={hint}
        error={error}
        disabled={disabled}
        onChange={(event) => {
          onChange({ ...value, date: event.target.value === "" ? null : event.target.value });
        }}
      />
      <Checkbox
        label={noTimeLabel}
        checked={withoutTime}
        disabled={disabled}
        onChange={(event) => {
          setTimeShown(!event.target.checked);
          onChange({ ...value, time: null });
        }}
      />
      {withoutTime ? null : (
        <TextField
          label={timeLabel}
          type="time"
          name={timeName}
          value={value.time ?? ""}
          disabled={disabled}
          onChange={(event) => {
            onChange({ ...value, time: event.target.value === "" ? null : event.target.value });
          }}
        />
      )}
    </div>
  );
}
