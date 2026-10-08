import { cancelAllOf, chatsOf, erasePointsOf, filedRideOfBooking } from './modules/bookings';
import { forgetTripViews } from './modules/channels';
import { forgetChat, forgetUnread } from './modules/chat';
import { openComplaintsOf } from './modules/complaints';
import { forgetDriver } from './modules/drivers';
import { forgetFavorites } from './modules/favorites';
import { forgetRatings } from './modules/ratings';
import { eraseRequestPointsOf } from './modules/ride-requests';
import { forgetSubscriptions } from './modules/route-subscriptions';
import { forgetFollows } from './modules/shares';
import { forgetSupport } from './modules/support';
import { wireAccountDeletion } from './modules/users';
import { closeWalletOf } from './modules/wallet';

// "Maʼlumotlarimni oʻchirish" (docs/30): what each module forgets of a deleted person. Here, next to
// module-events.ts, because it knows every module. The users module erases the profile itself.
wireAccountDeletion(async (env, userId) => {
  const open = await openComplaintsOf(env, userId);
  // The chat of an open complaint waits for the decision: it is the evidence (docs/65 A5).
  const rides = await Promise.all(open.map((complaint) => filedRideOfBooking(env, complaint.bookingId)));
  const evidence = new Set(rides.map((ride) => ride?.chatKey));
  // Live trips and bookings end the same way as on a block: the other side hears it (docs/17).
  await cancelAllOf(env, userId);
  // The points go at once, even under a complaint: the chat stays the evidence (docs/69).
  await erasePointsOf(env, userId);
  await eraseRequestPointsOf(env, userId);
  for (const key of await chatsOf(env, userId)) if (!evidence.has(key)) await forgetChat(env, key);
  // The plates «1 xabar» of the person go with the account (G53).
  await forgetUnread(env, userId);
  await forgetDriver(env, userId);
  await forgetFavorites(env, userId);
  await forgetSubscriptions(env, userId);
  await forgetFollows(env, userId);
  // The trips the person opened forget them: «N koʻrdi» counts only people with an account (G63).
  await forgetTripViews(env, userId);
  // The support talk goes with the account (G32, docs/30).
  await forgetSupport(env, userId);
  // A new account of the same person starts without old reviews and money (docs/65 A5).
  await forgetRatings(env, userId);
  await closeWalletOf(env, userId);
  return { holdPhone: open.some((complaint) => complaint.againstId === userId) };
});
