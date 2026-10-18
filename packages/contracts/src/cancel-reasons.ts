import { z } from 'zod';

// G87 V3 (docs/191): why a seat, a trip or an account went, in one tap and only if the person wants
// to say it. Counted as numbers, never with the person (docs/29).
export const CANCEL_REASONS = {
  booking: ['plans', 'found', 'wait', 'price', 'other'],
  trip: ['plans', 'empty', 'car', 'other'],
  account: ['done', 'other_app', 'privacy', 'hard', 'other'],
} as const;
export type CancelWhat = keyof typeof CANCEL_REASONS;
export type CancelReason = (typeof CANCEL_REASONS)[CancelWhat][number];

const WHATS = Object.keys(CANCEL_REASONS) as [CancelWhat, ...CancelWhat[]];
const REASONS = [...new Set(Object.values(CANCEL_REASONS).flat())] as [CancelReason, ...CancelReason[]];
export const cancelReasonFields = { what: z.enum(WHATS), reason: z.enum(REASONS) };
