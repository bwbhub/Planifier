import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailles de texte propres à `@planifier/tokens` (`theme.css`) : sans les déclarer, `text-control` serait pris pour
// une couleur et effacé par `text-ink`.
const twMerge = extendTailwindMerge({ extend: { theme: { text: ["control"] } } });

/** Assemble des classes Tailwind en résolvant les conflits (la dernière gagne). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
