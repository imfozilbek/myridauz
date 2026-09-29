import type { ErrorRow } from '@platform/contracts';
import { z } from 'zod';
import type { Counter } from '../domain/counters';

// Analytics Engine answers numbers as strings (FORMAT JSON).
const number = z.coerce.number().int().nonnegative();
const text = z.string();
export const sqlAnswerSchema = <T extends z.ZodType>(row: T) => z.object({ data: z.array(row) });

export const counterRow = z.object({ name: text, app: text, code: text, sessions: number, events: number });
export const errorRow = z.object({ app: text, screen: text, code: text, count: number });
export const totalRow = z.object({ count: number });

// An id of the contract; an empty or odd value becomes "unknown" (docs/29: ids only).
const ID = /^[a-z][a-z0-9_.]{0,47}$/;
const UNKNOWN = 'unknown';
const idOf = (value: string) => (ID.test(value) ? value : UNKNOWN);

export const toCounter = (row: z.infer<typeof counterRow>): Counter => row;
export const toErrorRow = (row: z.infer<typeof errorRow>): ErrorRow => ({
  app: idOf(row.app),
  screen: idOf(row.screen),
  code: idOf(row.code),
  count: row.count,
});
