import type { Db } from "../factory";
import { DEMO_MODULES, SEED_IDS } from "./ids";

/** Un Espace à deux personnes, créé par Alice : les deux en sont propriétaires par défaut (CONTEXT.md). */
export async function seedSpaces(db: Db) {
  await db.space.upsert({
    where: { id: SEED_IDS.space },
    create: {
      id: SEED_IDS.space,
      name: "Alice & Bob",
      modules: DEMO_MODULES,
      createdById: SEED_IDS.alice,
    },
    update: { name: "Alice & Bob", modules: DEMO_MODULES, createdById: SEED_IDS.alice },
  });

  // Les deux membres sont OWNER ; `update` ne touche que le rôle pour ne pas déplacer le membre.
  const members = [
    { id: SEED_IDS.spaceAlice, userId: SEED_IDS.alice },
    { id: SEED_IDS.spaceBob, userId: SEED_IDS.bob },
  ];
  for (const member of members) {
    await db.spaceMember.upsert({
      where: { id: member.id },
      create: { ...member, spaceId: SEED_IDS.space, role: "OWNER" },
      update: { role: "OWNER" },
    });
  }
}
