import { nextDueDate, type Recurrence } from "./recurrence";

/** Série neuve : rien n'a encore été fait, l'échéance sert d'ancre. */
export const fresh = (due: string | null) => ({ anchor: null, due });

/** Coche les occurrences une à une, le jour prévu, comme le ferait le serveur (ancre gardée). */
export function checkedOnTime(rule: Recurrence, firstDue: string, times: number): string[] {
  const dues = [];
  let due = firstDue;
  for (let i = 0; i < times; i += 1) {
    due = nextDueDate(rule, { anchor: firstDue, due }, due);
    dues.push(due);
  }
  return dues;
}
