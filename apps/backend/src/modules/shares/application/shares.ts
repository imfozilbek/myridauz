import { MAX_FOLLOWERS, type Booking, type Share, type SharedTrip } from '@platform/contracts';
import { hashToken, newToken, openUntil, shareStatus } from '../domain/share';
import type { Result, SharesDeps, ShareUpdate } from './ports';

type ShareError = 'shares.not_found' | 'shares.wrong_status';

// "Yaqinlarimga yuborish" (docs/43): only the passenger of a confirmed booking shares it.
export async function createShare(
  deps: SharesDeps,
  passengerId: number,
  bookingId: string,
): Promise<Result<Share, ShareError>> {
  const booking = await deps.booking(bookingId);
  if (booking?.passenger.id !== passengerId) return { ok: false, error: 'shares.not_found' };
  if (booking.status !== 'confirmed') return { ok: false, error: 'shares.wrong_status' };
  const token = newToken();
  const now = deps.now();
  await deps.shares.save({ tokenHash: await hashToken(token), bookingId, createdAt: now, revokedAt: null });
  const link = deps.link(token);
  const preparedMessageId = await deps.prepare(passengerId, await deps.texts.card(booking), link);
  return { ok: true, value: { preparedMessageId, link } };
}

export async function stopSharing(deps: SharesDeps, passengerId: number, bookingId: string) {
  const booking = await deps.booking(bookingId);
  if (booking?.passenger.id !== passengerId) return false;
  await deps.shares.revoke(bookingId, deps.now());
  return true;
}

// A link works until it is stopped and until a day after the arrival (docs/43).
async function openShare(deps: SharesDeps, token: string): Promise<Booking | null> {
  const share = await deps.shares.find(await hashToken(token));
  if (!share || share.revokedAt !== null) return null;
  const booking = await deps.booking(share.bookingId);
  if (!booking || deps.now() > openUntil(booking.trip.departAt, booking.trip.km)) return null;
  return booking;
}

export async function sharedTrip(deps: SharesDeps, token: string): Promise<SharedTrip | null> {
  const booking = await openShare(deps, token);
  if (!booking) return null;
  const { trip } = booking;
  return {
    passengerName: booking.passenger.firstName,
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    km: trip.km,
    driver: { firstName: trip.driver.firstName, car: trip.driver.car },
    plate: booking.plate,
    meetingPoint: booking.meetingPoint,
    status: shareStatus({ ...booking, departAt: trip.departAt }, deps.now()),
    followers: (await deps.shares.followers(booking.id)).length,
  };
}

// "Xabar olish": a close person gets bot messages about the trip, at most 5 people.
export async function follow(
  deps: SharesDeps,
  token: string,
  telegramId: number,
): Promise<Result<true, 'shares.not_found' | 'shares.too_many'>> {
  const booking = await openShare(deps, token);
  if (!booking) return { ok: false, error: 'shares.not_found' };
  const followers = await deps.shares.followers(booking.id);
  if (followers.includes(telegramId)) return { ok: true, value: true };
  if (followers.length >= MAX_FOLLOWERS) return { ok: false, error: 'shares.too_many' };
  await deps.shares.follow(booking.id, telegramId, deps.now());
  return { ok: true, value: true };
}

// "Mashinaga chiqdi", "Yetib keldi", "Safar bekor qilindi" to every close person (docs/43).
export async function tellFollowers(
  deps: Pick<SharesDeps, 'shares' | 'texts' | 'notify'>,
  booking: Booking,
  update: ShareUpdate,
) {
  const followers = await deps.shares.followers(booking.id);
  const text = deps.texts.update(booking, update);
  await deps.notify(followers.map((chatId) => ({ bot: 'passenger' as const, chatId, text })));
}
