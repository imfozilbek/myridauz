// Who changed a setting of the team: kept by the Telegram ID, shown to the team by the first name,
// never by the ID (docs/65 A3, G45).
export type Names = (ids: readonly number[]) => Promise<ReadonlyMap<number, string>>;

// The first name of every id of a list, read once.
export async function namer(names: Names, ids: readonly (number | null)[]) {
  const found = await names([...new Set(ids.filter((id): id is number => id !== null))]);
  return (id: number) => found.get(id) ?? '';
}
