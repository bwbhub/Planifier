import { TINTS } from "@/features/_shared/utils/tints";

import { SlotBlock } from "./slot-block";

/** Le créneau dans chacun de ses états, pour la page de référence des composants. */
export function SlotBlocksDemo() {
  const background = TINTS.general.background;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      <li>
        <SlotBlock as="group" title="Dentiste" time="09:00 – 10:00" background={background} />
      </li>
      <li>
        <SlotBlock
          as="group"
          title="Dîner chez Léo"
          time="19:30 – 22:00"
          background={TINTS.couple.background}
          maybe
        />
      </li>
      <li>
        <SlotBlock
          as="group"
          title="Appeler le garagiste"
          time="14:00 – 14:30"
          background={TINTS.work.background}
          greyed
        />
      </li>
      <li>
        <SlotBlock
          as="group"
          title="Rendez-vous privé"
          time="11:00 – 12:00"
          background={background}
          hidden
        />
      </li>
    </ul>
  );
}
