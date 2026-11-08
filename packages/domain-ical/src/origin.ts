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

/** Suffixe des `UID` que nous exportons : survit quand un service réécrit `PRODID` et retire les propriétés `X-`. */
export const UID_SUFFIX = "@planifier";

/** Événement exporté par Planifier ? (marque `X-PLANIFIER-ORIGIN` ou `UID` à notre suffixe) */
export function isOwnExportEvent(lines: ContentLine[]): boolean {
  return lines.some(
    (line) =>
      line.name === ORIGIN_PROPERTY ||
      (line.name === "UID" && line.value.trim().endsWith(UID_SUFFIX)),
  );
}
