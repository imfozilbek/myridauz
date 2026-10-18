import { CANCEL_REASONS, type CancelReason, type CancelWhat } from '@platform/contracts';
import type { useI18n } from '../context/i18n-context';

type T = ReturnType<typeof useI18n>['t'];

// The words of a reason of a cancel or a deletion (G87 V3): the sheet that asks it and the dashboard
// that counts it say the same; an odd reason shows as its code.
export function reasonWords(t: T, what: CancelWhat, reason: CancelReason): string {
  if (what === 'booking') {
    const key = CANCEL_REASONS.booking.find((one) => one === reason);
    return key ? t(`cancelReason.booking.${key}`) : reason;
  }
  if (what === 'trip') {
    const key = CANCEL_REASONS.trip.find((one) => one === reason);
    return key ? t(`cancelReason.trip.${key}`) : reason;
  }
  const key = CANCEL_REASONS.account.find((one) => one === reason);
  return key ? t(`cancelReason.account.${key}`) : reason;
}
