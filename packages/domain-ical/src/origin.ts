import type { ContentLine } from "./content-lines";

/** Identifiant de produit de nos exports (`PRODID`) : première moitié du marquage anti-boucle. */
export const PRODUCT_ID = "-//Planifier//Planifier//FR";
/** Propriété posée sur chaque événement exporté : seconde moitié du marquage (survit à un `PRODID` réécrit). */
export const ORIGIN_PROPERTY = "X-PLANIFIER-ORIGIN";
export const ORIGIN_VALUE = "export";

/** `PRODID` d'un export de Planifier ? */
export function isOwnExportProductId(line: ContentLine): boolean {
  return line.name === "PRODID" && line.value.trim().startsWith("-//Planifier//");
}

/** Événement marqué comme exporté par Planifier ? */
export function isOwnExportEvent(lines: ContentLine[]): boolean {
  return lines.some((line) => line.name === ORIGIN_PROPERTY);
}
