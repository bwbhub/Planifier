import { cn } from "./cn";

/** Allure d'un lien dans un texte (souligné, couleur d'accent, zone tactile de 44 px), pour `<a>` ou `next/link`. */
export function textLinkClassName(className?: string): string {
  return cn(
    "inline-flex min-h-11 items-center font-semibold text-accent-text underline",
    className,
  );
}
