import { LEAVE_REASONS, type LeaveKind, type LeaveReason } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';

type Label = { readonly reason: LeaveReason; readonly label: TranslationKey };

// The words of each reason of leaving (G87, docs/191): the sheet after the step and «Statistika».
export const LEAVE_LABELS: Readonly<Record<LeaveKind, readonly Label[]>> = {
  booking: LEAVE_REASONS.booking.map((reason) => ({
    reason,
    label: `leave.reason.booking.${reason}` as const,
  })),
  trip: LEAVE_REASONS.trip.map((reason) => ({ reason, label: `leave.reason.trip.${reason}` as const })),
  account: LEAVE_REASONS.account.map((reason) => ({
    reason,
    label: `leave.reason.account.${reason}` as const,
  })),
};

export const leaveLabelOf = (kind: LeaveKind, reason: LeaveReason): TranslationKey | undefined =>
  LEAVE_LABELS[kind].find((one) => one.reason === reason)?.label;
