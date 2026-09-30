import { cancelAllOf, chatsOf } from './modules/bookings';
import { forgetChat } from './modules/chat';
import { forgetDriver } from './modules/drivers';
import { forgetFavorites } from './modules/favorites';
import { forgetSubscriptions } from './modules/route-subscriptions';
import { forgetFollows } from './modules/shares';
import { wireAccountDeletion } from './modules/users';

// "Maʼlumotlarimni oʻchirish" (docs/30): what each module forgets of a deleted person. Here, next to
// module-events.ts, because it knows every module. The users module erases the profile itself.
wireAccountDeletion(async (env, userId) => {
  // Live trips and bookings end the same way as on a block: the other side hears it (docs/17).
  await cancelAllOf(env, userId);
  for (const key of await chatsOf(env, userId)) await forgetChat(env, key);
  await forgetDriver(env, userId);
  await forgetFavorites(env, userId);
  await forgetSubscriptions(env, userId);
  await forgetFollows(env, userId);
});
