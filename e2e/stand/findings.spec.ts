import { expect, test } from '@playwright/test';
import { createBookingsClient, createMarketClient } from '@platform/api-client';
import { answer, book, CHILONZOR, FARGONA, publishTrip } from './market-kit';
import { BEKZOD, ZARINA } from './people';
import { signedAs } from './stand-kit';
import { botMessages, clearBotMessages, runCron, standSql } from './stand-tools';

// Findings of G27 (docs/83), each as a check on the whole local Rida. A finding first fails here,
// then the fix makes it green.
test.describe.configure({ mode: 'serial' });

const MINUTE = 60 * 1000;
const POINTS = { pickup: { lat: 41.2847, lng: 69.2152 }, dropoff: { lat: 40.3765, lng: 71.7913 } };
const statusOf = async (bookingId: string) => {
  const mine = await createBookingsClient(await signedAs('passenger', ZARINA)).myBookings();
  return mine.find((booking) => booking.id === bookingId)?.status;
};

test('N02. a trip that already left cannot be cancelled away from its passengers', async () => {
  const trip = await publishTrip(BEKZOD, CHILONZOR, FARGONA, 'door');
  const booking = await book(ZARINA, trip, { seats: 1, mode: 'door', ...POINTS });
  await answer(BEKZOD, booking.id, 'confirm');
  // The trip left ten minutes ago; it ends hours later.
  standSql(`UPDATE trips SET depart_at = ${Date.now() - 10 * MINUTE} WHERE id = '${trip.id}'`);
  const market = createMarketClient(await signedAs('driver', BEKZOD));
  const cancelled = await market.cancelTrip(trip.id).then(
    () => 'cancelled',
    (error: Error) => error.message,
  );
  // Either the trip stays (a departed trip is not cancelled) or its seat follows it; never a
  // cancelled trip with a confirmed seat nobody told about.
  const seat = await statusOf(booking.id);
  expect({ cancelled, seat }).not.toEqual({ cancelled: 'cancelled', seat: 'confirmed' });
});

test('N03. a seat the driver never answered: the passenger hears it expired', async () => {
  // Open finding: the bot text waits for the owner (docs/86 T10). This mark fails once it is fixed.
  test.fail();
  const trip = await publishTrip(BEKZOD, CHILONZOR, FARGONA, 'door');
  const booking = await book(ZARINA, trip, { seats: 1, mode: 'door', ...POINTS });
  await clearBotMessages();
  standSql(`UPDATE bookings SET expires_at = ${Date.now() - MINUTE} WHERE id = '${booking.id}'`);
  await runCron();
  await expect.poll(() => statusOf(booking.id)).toBe('expired');
  const told = (await botMessages()).filter((m) => m.bot === 'passenger' && m.chatId === ZARINA.id);
  expect(told.length, 'the passenger bot tells Zarina').toBeGreaterThan(0);
});
