import { MAX_FOLLOWERS, type Booking, type Share, type SharedTrip } from '@platform/contracts';
import { hashToken, openUntil, shareStatus, type ShareSubject } from '../domain/share';
import { driverShared } from './driver-shares';
import { issueLink, tellAll } from './links';
import type { Result, SharesDeps, ShareUpdate } from './ports';

type ShareError = 'shares.not_found' | 'shares.wrong_status';

// "Yaqinlarimga yuborish" (docs/43): only the passenger of a confirmed booking shares it.
export async function createShare(
  deps: SharesDeps,
  passengerId: number,
  bookingId: string,
): Promise<Result<Share, ShareError>> {
  const found = await deps.booking(bookingId);
  if (found?.passengerId !== passengerId) return { ok: false, error: 'shares.not_found' };
  if (found.view.status !== 'confirmed') return { ok: false, error: 'shares.wrong_status' };
  const text = await deps.texts.card(found.view);
  return { ok: true, value: await issueLink(deps, { kind: 'booking', id: bookingId }, passengerId, text) };
}

export async function stopSharing(deps: SharesDeps, passengerId: number, bookingId: string) {
  if ((await deps.booking(bookingId))?.passengerId !== passengerId) return false;
  await deps.shares.revoke({ kind: 'booking', id: bookingId }, deps.now());
  return true;
}

function bookingShared(deps: SharesDeps, booking: Booking, followers: number): SharedTrip | null {
  const { trip } = booking;
  if (deps.now() > openUntil(trip.departAt, trip.km)) return null;
  return {
    passengerName: booking.passenger.firstName,
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    km: trip.km,
    driver: { firstName: trip.driver.firstName, car: trip.driver.car },
    plate: booking.plate,
    // Where the passenger boards: the pitak or the own point at the door (docs/43, docs/70).
    meetingPoint: booking.pitak?.point ?? booking.pickup?.point ?? null,
    status: shareStatus({ ...booking, departAt: trip.departAt }, deps.now()),
    followers,
  };
}

// A link works until it is stopped and until a day after the arrival (docs/43).
async function openShare(
  deps: SharesDeps,
  token: string,
): Promise<{ readonly subject: ShareSubject; readonly trip: SharedTrip } | null> {
  const share = await deps.shares.find(await hashToken(token));
  if (!share || share.revokedAt !== null) return null;
  const { subject } = share;
  const followers = (await deps.shares.followers(subject)).length;
  if (subject.kind === 'trip') {
    const trip = await deps.driverTrip(subject.id);
    const view = trip ? driverShared(trip, followers, deps.now()) : null;
    return view && { subject, trip: view };
  }
  const booking = (await deps.booking(subject.id))?.view;
  const view = booking ? bookingShared(deps, booking, followers) : null;
  return view && { subject, trip: view };
}

export const sharedTrip = async (deps: SharesDeps, token: string) =>
  (await openShare(deps, token))?.trip ?? null;

// "Xabar olish": a close person gets bot messages about the trip, at most 5 people.
export async function follow(
  deps: SharesDeps,
  token: string,
  telegramId: number,
): Promise<Result<true, 'shares.not_found' | 'shares.too_many'>> {
  const opened = await openShare(deps, token);
  if (!opened) return { ok: false, error: 'shares.not_found' };
  const followers = await deps.shares.followers(opened.subject);
  if (followers.includes(telegramId)) return { ok: true, value: true };
  if (followers.length >= MAX_FOLLOWERS) return { ok: false, error: 'shares.too_many' };
  await deps.shares.follow(opened.subject, telegramId, deps.now());
  return { ok: true, value: true };
}

// "Mashinaga chiqdi", "Yetib keldi", "Safar bekor qilindi" to every close person (docs/43).
export const tellFollowers = (
  deps: Pick<SharesDeps, 'shares' | 'texts' | 'notify'>,
  booking: Booking,
  update: ShareUpdate,
) => tellAll(deps, { kind: 'booking', id: booking.id }, deps.texts.update(booking, update));
