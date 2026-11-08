/** Ligne de contenu iCal (RFC 5545 §3.1) : `NOM;PARAM=valeur:valeur`. */
export interface ContentLine {
  name: string;
  params: Record<string, string>;
  value: string;
}

/** Défait le pliage des lignes : une ligne qui commence par un espace ou une tabulation continue la précédente. */
export function unfold(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r\n|\n|\r/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines.push(`${lines.pop() ?? ""}${raw.slice(1)}`);
    } else {
      lines.push(raw);
    }
  }
  return lines.filter((line) => line !== "");
}

/** Position du premier `:` hors guillemets (les paramètres peuvent en contenir entre guillemets). */
function valueStart(line: string): number {
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') quoted = !quoted;
    else if (char === ":" && !quoted) return index;
  }
  return -1;
}

function parseParams(source: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const part of source) {
    const equals = part.indexOf("=");
    if (equals > 0) {
      params[part.slice(0, equals).toUpperCase()] = part.slice(equals + 1).replaceAll('"', "");
    }
  }
  return params;
}

/** Lit une ligne dépliée ; `null` si elle n'a pas la forme `nom:valeur`. */
export function parseContentLine(line: string): ContentLine | null {
  const colon = valueStart(line);
  if (colon <= 0) return null;
  const [name = "", ...params] = line.slice(0, colon).split(";");
  return { name: name.toUpperCase(), params: parseParams(params), value: line.slice(colon + 1) };
}

/** Valeur d'un champ texte : retire les échappements `\n`, `\,`, `\;`, `\\`. */
export function unescapeText(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, char: string) =>
    char === "n" || char === "N" ? "\n" : char,
  );
}
