import { useSyncExternalStore } from "react";

import { today } from "@/lib/format-date";

const noSubscription = () => () => undefined;

/** Jour de l'appareil, connu après l'hydratation seulement : le serveur ne connaît pas son fuseau. */
export function useDeviceDay(): string | null {
  return useSyncExternalStore(
    noSubscription,
    () => today(),
    () => null,
  );
}
