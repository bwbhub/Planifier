import { daysBetween, MS_PER_DAY, WHEN_MAX_DAYS } from "@planifier/constants/days";
import { z } from "zod";

/** Jour `AAAA-MM-JJ`, sans heure ni fuseau. */
export const daySchema = z.iso.date();

export const spansAtMost = (startMs: number, endMs: number, days: number) =>
  endMs - startMs <= days * MS_PER_DAY;

export const timedFields = { allDay: z.literal(false), startsAt: z.date(), endsAt: z.date() };
/** `endDay` inclus : un élément d'un jour a `startDay` égal à `endDay`. */
export const allDayFields = { allDay: z.literal(true), startDay: daySchema, endDay: daySchema };

const timedInputSchema = z
  .strictObject(timedFields)
  .refine(({ startsAt, endsAt }) => startsAt < endsAt, "La fin doit suivre le début.")
  .refine(
    ({ startsAt, endsAt }) => spansAtMost(startsAt.getTime(), endsAt.getTime(), WHEN_MAX_DAYS),
    "Trop long.",
  );

const allDayInputSchema = z
  .strictObject(allDayFields)
  .refine(({ startDay, endDay }) => startDay <= endDay, "La fin doit suivre le début.")
  .refine(({ startDay, endDay }) => daysBetween(startDay, endDay) < WHEN_MAX_DAYS, "Trop long.");

/** Horaire (instants) ou à la journée (jours, sans fuseau) : jamais les deux. Entrée d'agenda ou événement. */
export const whenInputSchema = z.discriminatedUnion("allDay", [
  timedInputSchema,
  allDayInputSchema,
]);

/** En sortie, la forme seule : une borne d'écriture ne doit pas rendre illisible un élément importé, plus long. */
export const whenOutputSchema = z.discriminatedUnion("allDay", [
  z.strictObject(timedFields),
  z.strictObject(allDayFields),
]);

export type When = z.infer<typeof whenOutputSchema>;
