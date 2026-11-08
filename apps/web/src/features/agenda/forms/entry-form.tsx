"use client";

import {
  type AgendaEntryOutput,
  createEntryInputSchema,
  updateEntryInputSchema,
} from "@planifier/api-contract";
import {
  AGENDA_DESCRIPTION_MAX_LENGTH,
  AGENDA_LOCATION_MAX_LENGTH,
  AGENDA_MAX_PARTICIPANTS,
  AGENDA_PARTICIPANT_MAX_LENGTH,
  AGENDA_TITLE_MAX_LENGTH,
} from "@planifier/constants/agenda";
import { Button } from "@planifier/ui/components/button";
import { Checkbox } from "@planifier/ui/components/checkbox";
import { ChoiceGroup } from "@planifier/ui/components/choice-group";
import { ConfirmPanel } from "@planifier/ui/components/confirm-panel";
import { TextAreaField } from "@planifier/ui/components/text-area-field";
import { TextField } from "@planifier/ui/components/text-field";
import { type SubmitEvent, useState } from "react";

import { useFormValidation } from "@/features/_shared/forms/use-form-validation";
import { TINT_OPTIONS } from "@/features/_shared/utils/tints";
import { COMMON_LABELS } from "@/lib/labels";

import { useCreateEntry, useDeleteEntry, useUpdateEntry } from "../queries/agenda.queries";
import { toLocalInput } from "../utils/agenda-dates";
import { agendaErrorMessage } from "../utils/agenda-error-message";
import { participantsFromText } from "../utils/agenda-participants";

/** Horaire proposé par défaut. */
const DEFAULT_START = "09:00";
const DEFAULT_END = "10:00";

const FIELDS = ["title", "when", "location", "participants", "description"] as const;
type Field = (typeof FIELDS)[number];

const TITLE_ERROR = `Donne un titre à l'entrée, ${String(AGENDA_TITLE_MAX_LENGTH)} caractères au plus.`;
const WHEN_ERROR = "La fin doit suivre le début, sur un an au plus.";
const LOCATION_ERROR = `${String(AGENDA_LOCATION_MAX_LENGTH)} caractères au plus.`;
const PARTICIPANTS_ERROR = `${String(AGENDA_MAX_PARTICIPANTS)} noms au plus, de ${String(AGENDA_PARTICIPANT_MAX_LENGTH)} caractères chacun.`;
/** Tous les noms au plus long, et leurs virgules. */
const PARTICIPANTS_MAX_LENGTH = AGENDA_MAX_PARTICIPANTS * (AGENDA_PARTICIPANT_MAX_LENGTH + 2);
const DESCRIPTION_ERROR = `${String(AGENDA_DESCRIPTION_MAX_LENGTH)} caractères au plus.`;

/** Champ facultatif laissé vide : `null`. */
function optionalText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

const asText = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");

/** Dates du formulaire ⇒ forme du contrat. Une date vide ou invalide reste telle quelle : le schéma la refuse. */
function whenFromForm(data: FormData, allDay: boolean) {
  const start = asText(data.get("start"));
  const end = asText(data.get("end"));
  return allDay
    ? { allDay, startDay: start, endDay: end }
    : { allDay, startsAt: new Date(start), endsAt: new Date(end) };
}

/** Bornes affichées d'une entrée, ou celles proposées pour `day` à la création. */
function initialBounds(entry: AgendaEntryOutput | undefined, day: string, allDay: boolean) {
  if (entry === undefined) {
    return allDay
      ? { start: day, end: day }
      : { start: `${day}T${DEFAULT_START}`, end: `${day}T${DEFAULT_END}` };
  }
  const { when } = entry;
  if (when.allDay) {
    return allDay
      ? { start: when.startDay, end: when.endDay }
      : { start: `${when.startDay}T${DEFAULT_START}`, end: `${when.endDay}T${DEFAULT_END}` };
  }
  const start = toLocalInput(when.startsAt);
  const end = toLocalInput(when.endsAt);
  return allDay ? { start: start.slice(0, 10), end: end.slice(0, 10) } : { start, end };
}

/** Titre proposé : celui de l'entrée modifiée, sinon celui de la tâche dont on part. */
function initialTitle(
  entry: AgendaEntryOutput | undefined,
  fromTask: EntryFormProps["fromTask"],
): string | undefined {
  return entry?.title ?? fromTask?.title;
}

interface EntryFormProps {
  /** Entrée à modifier ; absente : création. */
  entry?: AgendaEntryOutput | undefined;
  /** Jour proposé à la création. */
  day: string;
  /** Création depuis une tâche : son titre est proposé et l'entrée lui est liée (sens unique, rien ne se coche). */
  fromTask?: { id: string; title: string } | undefined;
  onDone: () => void;
}

function DeleteEntry({ entryId, onDone }: { entryId: string; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const deleteEntry = useDeleteEntry();
  if (!confirming) {
    return (
      <Button
        variant="ghost"
        onClick={() => {
          setConfirming(true);
        }}
      >
        Supprimer
      </Button>
    );
  }
  return (
    <>
      <ConfirmPanel
        question="Supprimer cette entrée ?"
        confirmLabel="Supprimer l'entrée"
        keepLabel="Garder l'entrée"
        pending={deleteEntry.isPending}
        onConfirm={() => {
          deleteEntry.mutate({ entryId }, { onSuccess: onDone });
        }}
        onKeep={() => {
          setConfirming(false);
        }}
      />
      {deleteEntry.isError ? (
        <p role="alert" className="text-sm text-accent-text">
          {agendaErrorMessage(deleteEntry.error)}
        </p>
      ) : null}
    </>
  );
}

interface EntryFieldsProps {
  entry: AgendaEntryOutput | undefined;
  invalid: ReadonlySet<Field>;
}

/** Facultatifs : lieu et description. */
function EntryDetails({ entry, invalid }: EntryFieldsProps) {
  return (
    <>
      <TextField
        label="Lieu"
        name="location"
        defaultValue={entry?.location ?? undefined}
        maxLength={AGENDA_LOCATION_MAX_LENGTH}
        error={invalid.has("location") ? LOCATION_ERROR : undefined}
      />
      <TextField
        label="Participants"
        name="participants"
        hint="Séparés par des virgules. Juste un nom : personne n'est prévenu."
        placeholder="Ex. : Marie, Léo"
        defaultValue={entry?.participants.join(", ")}
        maxLength={PARTICIPANTS_MAX_LENGTH}
        error={invalid.has("participants") ? PARTICIPANTS_ERROR : undefined}
      />
      <TextAreaField
        label="Description"
        name="description"
        hint="Visible par toi seul."
        defaultValue={entry?.description ?? undefined}
        maxLength={AGENDA_DESCRIPTION_MAX_LENGTH}
        error={invalid.has("description") ? DESCRIPTION_ERROR : undefined}
      />
    </>
  );
}

/** Teinte et masquage dans les Espaces. */
function EntryDisplay({ entry }: { entry: AgendaEntryOutput | undefined }) {
  return (
    <>
      <ChoiceGroup
        legend="Teinte"
        name="tint"
        options={TINT_OPTIONS}
        defaultValue={entry?.tint ?? "general"}
      />
      <Checkbox
        label="Masquer dans mes Espaces"
        hint="Ses membres ne voient ni le titre, ni que tu es occupé."
        name="hidden"
        defaultChecked={entry?.hidden ?? false}
      />
    </>
  );
}

interface EntryWhenProps extends EntryFieldsProps {
  day: string;
  allDay: boolean;
  onAllDayChange: (allDay: boolean) => void;
}

function EntryWhen({ entry, invalid, day, allDay, onAllDayChange }: EntryWhenProps) {
  const inputType = allDay ? "date" : "datetime-local";
  const bounds = initialBounds(entry, day, allDay);
  return (
    <>
      <Checkbox
        label="Toute la journée"
        checked={allDay}
        onChange={(event) => {
          onAllDayChange(event.currentTarget.checked);
        }}
      />
      {/* Remontés à chaque changement de forme : la valeur d'un champ date ne vaut pas pour datetime-local. */}
      <TextField
        key={`start-${inputType}`}
        label="Début"
        name="start"
        type={inputType}
        defaultValue={bounds.start}
        required
      />
      <TextField
        key={`end-${inputType}`}
        label="Fin"
        name="end"
        type={inputType}
        defaultValue={bounds.end}
        required
        error={invalid.has("when") ? WHEN_ERROR : undefined}
      />
    </>
  );
}

/** Envoi du formulaire : création, ou modification de `entry`. */
function useEntrySubmit(
  entry: AgendaEntryOutput | undefined,
  allDay: boolean,
  taskId: string | undefined,
  onDone: () => void,
) {
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const { invalid, validate } = useFormValidation(FIELDS);
  // Version lue à l'ouverture : enregistrer après un changement venu d'ailleurs doit le signaler (STALE_VERSION).
  const [openedVersion] = useState(entry?.version);

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const common = {
      title: data.get("title"),
      when: whenFromForm(data, allDay),
      tint: data.get("tint"),
      hidden: data.get("hidden") === "on",
      participants: participantsFromText(asText(data.get("participants"))),
    };
    const location = optionalText(data.get("location"));
    const description = optionalText(data.get("description"));
    if (entry === undefined) {
      // Création : un champ vide est absent.
      const input = validate(form, createEntryInputSchema, {
        ...common,
        location: location ?? undefined,
        description: description ?? undefined,
        taskId,
      });
      if (input !== null) createEntry.mutate(input, { onSuccess: onDone });
      return;
    }
    // Modification : un champ vidé vaut `null`, il est effacé.
    const input = validate(form, updateEntryInputSchema, {
      ...common,
      entryId: entry.id,
      version: openedVersion,
      location,
      description,
    });
    if (input !== null) updateEntry.mutate(input, { onSuccess: onDone });
  }

  return { submit, invalid, mutation: entry === undefined ? createEntry : updateEntry };
}

/** Un seul formulaire pour créer une entrée et la modifier : titre et horaire obligatoires, le reste facultatif. */
export function EntryForm({ entry, day, fromTask, onDone }: EntryFormProps) {
  const [allDay, setAllDay] = useState(entry?.when.allDay ?? false);
  const { submit, invalid, mutation } = useEntrySubmit(entry, allDay, fromTask?.id, onDone);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(event.currentTarget);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        label="Titre"
        name="title"
        placeholder="Ex. : dentiste"
        defaultValue={initialTitle(entry, fromTask)}
        maxLength={AGENDA_TITLE_MAX_LENGTH}
        required
        autoFocus
        error={invalid.has("title") ? TITLE_ERROR : undefined}
      />
      <EntryWhen
        entry={entry}
        invalid={invalid}
        day={day}
        allDay={allDay}
        onAllDayChange={setAllDay}
      />
      <EntryDetails entry={entry} invalid={invalid} />
      <EntryDisplay entry={entry} />
      {mutation.isError ? (
        <p role="alert" className="text-sm text-accent-text">
          {agendaErrorMessage(mutation.error)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {entry === undefined ? "Ajouter" : COMMON_LABELS.save}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {COMMON_LABELS.cancel}
        </Button>
      </div>
      {entry === undefined ? null : <DeleteEntry entryId={entry.id} onDone={onDone} />}
    </form>
  );
}
