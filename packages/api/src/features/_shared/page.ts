/** Page d'une lecture par curseur : `rows` lues avec `take: limit + 1`, la ligne de trop dit s'il en reste. */
export function toPage<TRow extends { id: string }, TItem>(
  rows: readonly TRow[],
  limit: number,
  toItem: (row: TRow) => TItem,
): { items: TItem[]; nextCursor: string | null } {
  const page = rows.slice(0, limit);
  return {
    items: page.map(toItem),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  };
}
