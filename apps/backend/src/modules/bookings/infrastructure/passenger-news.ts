import type { BrandConfig } from '@platform/brands';
import { isQuietTime, MINUTE_MS, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import type { Places } from '../../../shared/places/end-names';
import { bold, escapeHtml } from '../../../shared/telegram/html';
import { passengerTripCard } from '../../../shared/telegram/card-keys';
import { passengerCard } from './passenger-card';

const { t, formatTime } = createI18n(DEFAULT_LOCALE);

// The short news under the trip card of a passenger (G68, docs/122: 8 rings, the trip ones here).
type PassengerRing =
  'confirmed' | 'declined' | 'expired' | 'cancelledByDriver' | 'retimed' | 'soon' | 'departed' | 'driverCame';

// The trip starts now: these ring at night too (docs/122 rule 3, «2 soat qoldi»).
const ANY_HOUR: ReadonlySet<PassengerRing> = new Set(['soon', 'driverCame']);
// Mockup g68/1: «Safarga 2 soat qoldi: 08:20 da pitakda boʻling» for a trip at 08:30.
const AT_PITAK_EARLY_MINUTES = 10;

const at = (ms: number) => formatTime(new Date(ms));

function ringText(booking: Booking, kind: PassengerRing): string {
  const name = escapeHtml(booking.trip.driver.firstName);
  const { departAt } = booking.trip;
  switch (kind) {
    case 'retimed':
      return t('bot.ring.retimed', { time: bold(at(departAt)) });
    case 'soon':
      return booking.pitak
        ? t('bot.ring.soonPitak', { time: at(departAt - AT_PITAK_EARLY_MINUTES * MINUTE_MS) })
        : t('bot.ring.soonDoor', { time: at(departAt) });
    case 'expired':
      return t('bot.ring.expired');
    default:
      return t(`bot.ring.${kind}`, { name });
  }
}

export type PassengerNewsWiring = {
  readonly brand: BrandConfig;
  readonly places: () => Promise<Places>;
  readonly show: (cards: readonly Card[], rings: readonly Ring[]) => Promise<void>;
  // A view carries public ids; the bot writes to the Telegram ID behind one (docs/65 A3).
  readonly telegramId: (publicId: string) => Promise<number | undefined>;
  readonly now: () => number;
};

export type PassengerNews = (booking: Booking, ring?: PassengerRing) => Promise<void>;

// The seat changed: its card shows it without sound; a ring under it when the person has to act.
export const passengerNews =
  ({ brand, places, show, telegramId, now }: PassengerNewsWiring): PassengerNews =>
  async (booking, ring) => {
    const chatId = await telegramId(booking.passenger.id);
    if (chatId === undefined) return;
    const time = now();
    const card = passengerCard({ brand, chatId, booking, places: await places(), now: time });
    const quiet = ring !== undefined && !ANY_HOUR.has(ring) && isQuietTime(time);
    const rings: Ring[] = ring
      ? [
          {
            bot: 'passenger',
            chatId,
            text: ringText(booking, ring),
            card: passengerTripCard(booking.id),
            quiet,
          },
        ]
      : [];
    await show([card], rings);
  };
