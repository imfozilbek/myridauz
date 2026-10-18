// Why a person cancelled a seat or a trip or deleted the account (G87, docs/191): one tap on a short
// list after the step, never asked before it and always possible to skip. Only the id of the reason
// is kept, never who gave it.
export const LEAVE_KINDS = ['booking', 'trip', 'account'] as const;
export type LeaveKind = (typeof LEAVE_KINDS)[number];

export const LEAVE_REASONS = {
  booking: ['plans_changed', 'found_other', 'driver', 'time', 'other'],
  trip: ['plans_changed', 'no_passengers', 'car', 'other'],
  account: ['not_needed', 'no_trips', 'hard', 'privacy', 'other'],
} as const satisfies Record<LeaveKind, readonly string[]>;
export type LeaveReason = (typeof LEAVE_REASONS)[LeaveKind][number];
export const LEAVE_REASON_IDS = [...new Set(Object.values(LEAVE_REASONS).flat())] as [
  LeaveReason,
  ...LeaveReason[],
];
