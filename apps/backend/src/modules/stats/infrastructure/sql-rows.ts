import type { ErrorRow } from '@platform/contracts';
import { z } from 'zod';
import type { Counter } from '../domain/counters';

// Analytics Engine answers numbers as strings (FORMAT JSON).
const number = z.coerce.number().int().nonnegative();
const text = z.string();
export const sqlAnswerSchema = <T extends z.ZodType>(row: T) => z.object({ data: z.array(row) });

export const counterRow = z.object({ name: text, app: text, code: text, sessions: number, events: number });
export const errorRow = z.object({
  name: text,
  app: text,
  screen: text,
  code: text,
  error: text,
  detail: text,
  count: number,
});
export const totalRow = z.object({ count: number });

// An id of the contract; an empty or odd value becomes "unknown" (docs/29: ids only).
const ID = /^[a-z][a-z0-9_.]{0,47}$/;
const UNKNOWN = 'unknown';
const idOf = (value: string) => (ID.test(value) ? value : UNKNOWN);

export const toCounter = (row: z.infer<typeof counterRow>): Counter => row;
// The words of a crash and the place of a server failure keep only safe signs (G52, docs/112).
const NOT_SAFE = /[^A-Za-z0-9 .,'()_:#/-]+/g;
const MAX_WHAT = 170;
const KINDS = { client_error: 'crash', server_error: 'server' } as const;
const kindOf = (name: string): ErrorRow['kind'] => KINDS[name as keyof typeof KINDS] ?? 'refusal';
function whatOf(kind: ErrorRow['kind'], row: z.infer<typeof errorRow>): string {
  const words =
    kind === 'crash' ? [row.error, row.detail].filter(Boolean).join(': ') : kind === 'server' ? row.code : '';
  return words.replace(NOT_SAFE, ' ').trim().slice(0, MAX_WHAT);
}
export const toErrorRow = (row: z.infer<typeof errorRow>): ErrorRow => {
  const kind = kindOf(row.name);
  return {
    kind,
    app: idOf(row.app),
    screen: idOf(row.screen),
    code: idOf(row.code),
    what: whatOf(kind, row),
    count: row.count,
  };
};
