// D1 binds at most 100 values in one query: a list of ids goes in parts of 90 (docs/65 A2).
export const IN_LIST_LIMIT = 90;

type Value = string | number;

const partsOf = (ids: readonly Value[]): Value[][] => {
  const unique = [...new Set(ids)];
  return Array.from({ length: Math.ceil(unique.length / IN_LIST_LIMIT) }, (_, index) =>
    unique.slice(index * IN_LIST_LIMIT, (index + 1) * IN_LIST_LIMIT),
  );
};

const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');

// The rows of `sql(marks)` for every part of the ids, sent in one batch; `before` binds first.
export async function allIn<Row>(
  db: D1Database,
  sql: (marks: string) => string,
  ids: readonly Value[],
  before: readonly Value[] = [],
): Promise<Row[]> {
  if (ids.length === 0) return [];
  const statements = partsOf(ids).map((part) => db.prepare(sql(marks(part.length))).bind(...before, ...part));
  const results = await db.batch<Row>(statements);
  return results.flatMap((result) => result.results);
}
