import type { Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// «Kelmadi · qaytarish 9 000 kutilmoqda» (docs/129, mockup g63/5): what became of the commission of
// a passenger who did not come; null for a passenger who came or is still awaited.
export function useNoShowText() {
  const { t, formatNumber } = useI18n();
  return (booking: Booking): string | null => {
    if (booking.noShowAt === null) return null;
    const amount = formatNumber(booking.refund?.amount ?? booking.commission);
    if (booking.refund?.state === 'confirmed') return t('driverAfter.noShow.refunded', { amount });
    if (booking.refund?.state === 'rejected') return t('driverAfter.noShow.mark');
    return t('driverAfter.noShow.waiting', { amount });
  };
}

// The refund still waits for the team and the owner (docs/35): nothing decided, or proposed.
export const refundWaits = (booking: Booking) =>
  booking.noShowAt !== null && (booking.refund === null || booking.refund.state === 'proposed');
