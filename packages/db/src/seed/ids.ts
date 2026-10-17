import type { AppModule } from "../generated/client/enums";

// Identifiants fixes des données de démo : ils rendent le seed idempotent (upsert sur ces ids).
export const SEED_IDS = {
  alice: "00000000-0000-7000-8000-000000000001",
  bob: "00000000-0000-7000-8000-000000000002",
  chloe: "00000000-0000-7000-8000-000000000003",
  space: "00000000-0000-7000-8000-000000000010",
  spaceAlice: "00000000-0000-7000-8000-000000000011",
  spaceBob: "00000000-0000-7000-8000-000000000012",
  spaceEvent: "00000000-0000-7000-8000-000000000020",
  personalEvent: "00000000-0000-7000-8000-000000000021",
  participantAlice: "00000000-0000-7000-8000-000000000030",
  participantBob: "00000000-0000-7000-8000-000000000031",
  participantChloe: "00000000-0000-7000-8000-000000000032",
  participantAlicePersonal: "00000000-0000-7000-8000-000000000033",
  eventSettings: "00000000-0000-7000-8000-000000000040",
  personalEventSettings: "00000000-0000-7000-8000-000000000041",
  eventInvite: "00000000-0000-7000-8000-000000000050",
  eventComment: "00000000-0000-7000-8000-000000000060",
} as const;

/** Modules activés pour les comptes et l'Espace de démo. */
export const DEMO_MODULES: AppModule[] = ["TODO", "AGENDA", "EVENTS"];
