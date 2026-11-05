import type { Db } from "../factory";
import { SEED_IDS } from "./ids";

const day = (value: string) => new Date(`${value}T00:00:00Z`);
const instant = (value: string) => new Date(`${value}Z`);

const ENTRIES = [
  {
    id: SEED_IDS.entryDentist,
    ownerId: SEED_IDS.alice,
    title: "Dentiste",
    location: "Cabinet du centre",
    participants: [],
    tint: "general",
    hidden: false,
    startsAt: instant("2026-11-05T09:00:00"),
    endsAt: instant("2026-11-05T10:00:00"),
    startDay: null,
    endDay: null,
  },
  {
    id: SEED_IDS.entrySurprise,
    ownerId: SEED_IDS.alice,
    title: "Préparer la surprise",
    location: null,
    participants: [],
    tint: "couple",
    hidden: true,
    startsAt: instant("2026-11-05T17:00:00"),
    endsAt: instant("2026-11-05T18:00:00"),
    startDay: null,
    endDay: null,
  },
  {
    id: SEED_IDS.entryWeekend,
    ownerId: SEED_IDS.alice,
    title: "Week-end à la mer",
    location: null,
    participants: [],
    tint: "trip",
    hidden: false,
    startsAt: null,
    endsAt: null,
    startDay: day("2026-11-14"),
    endDay: day("2026-11-15"),
  },
  {
    id: SEED_IDS.entryMeeting,
    ownerId: SEED_IDS.bob,
    title: "Réunion d'équipe",
    location: null,
    participants: ["Marie", "Léo"],
    tint: "work",
    hidden: false,
    startsAt: instant("2026-11-05T09:30:00"),
    endsAt: instant("2026-11-05T11:00:00"),
    startDay: null,
    endDay: null,
  },
];

/** Quelques entrées d'Alice et Bob, dont une masquée et une à la journée, qui se chevauchent dans leur Espace. */
export async function seedAgenda(db: Db) {
  for (const { id, ...entry } of ENTRIES) {
    await db.agendaEntry.upsert({ where: { id }, create: { id, ...entry }, update: entry });
  }
}
