import { z } from 'zod';

// All dates and times of Rida are Tashkent time, UTC+5 without summer time (docs/35).
export const HOUR_MS = 60 * 60 * 1000;
const TASHKENT_OFFSET_MS = 5 * HOUR_MS;
export const DAY_MS = 24 * HOUR_MS;

// A calendar day in Tashkent: "2026-10-01".
export const tashkentDate = (ms: number) => new Date(ms + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
export const tashkentDayStart = (date: string) => Date.parse(`${date}T00:00:00Z`) - TASHKENT_OFFSET_MS;
// Hours and minutes in Tashkent: "07:30".
export const tashkentTime = (ms: number) => new Date(ms + TASHKENT_OFFSET_MS).toISOString().slice(11, 16);

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => tashkentDate(tashkentDayStart(date)) === date);
