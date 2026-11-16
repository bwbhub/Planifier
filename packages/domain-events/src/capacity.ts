import type { ParticipantStatus } from "@planifier/constants/events";

/**
 * Personnes qui y vont : les participants en « J'y vais » et les invités sans compte qui ont répondu « J'y vais » par
 * leur lien. Les deux listes sont des statuts, un par personne.
 */
export function goingCount({
  participants,
  visitorInvites,
}: {
  participants: readonly ParticipantStatus[];
  visitorInvites: readonly ParticipantStatus[];
}): number {
  return [...participants, ...visitorInvites].filter((status) => status === "GOING").length;
}

/**
 * Reste-t-il une place pour répondre « J'y vais » ? `max` null : illimité. Qui y allait déjà (`wasGoing`) garde sa
 * place même si l'événement est complet ou que le plafond a été abaissé depuis.
 */
export function hasRoomFor({
  max,
  going,
  wasGoing,
}: {
  max: number | null;
  going: number;
  wasGoing: boolean;
}): boolean {
  return max === null || wasGoing || going < max;
}
