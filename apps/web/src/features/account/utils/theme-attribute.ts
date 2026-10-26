import type { ThemePreference } from "@planifier/constants/account";

const ATTRIBUTES = { SYSTEM: undefined, LIGHT: "light", DARK: "dark" } as const;

/** Valeur de `data-theme` sur `<html>` (lue par `@planifier/tokens`) ; sans attribut, le thème suit l'appareil. */
export function themeAttribute(preference: ThemePreference): "light" | "dark" | undefined {
  return ATTRIBUTES[preference];
}
