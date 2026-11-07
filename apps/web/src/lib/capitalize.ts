/** Première lettre en majuscule : « mardi » ⇒ « Mardi ». */
export function capitalized(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
