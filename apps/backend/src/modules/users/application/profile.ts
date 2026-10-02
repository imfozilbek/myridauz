import type { PublicProfile } from '@platform/contracts';
import { toPublicProfile } from '../domain/profiles';
import type { Caller, Failure, UsersDeps } from './ports';

export async function getPublicProfile(
  deps: UsersDeps,
  userId: number,
): Promise<{ readonly ok: true; readonly profile: PublicProfile } | Failure<'users.not_found'>> {
  const user = await deps.users.find(userId);
  return user ? { ok: true, profile: toPublicProfile(user) } : { ok: false, error: 'users.not_found' };
}

// «Bot xabarlari» (docs/88 L1): the news of the bot on or off; booking messages always go.
export async function setNews(
  deps: UsersDeps,
  caller: Caller,
  on: boolean,
): Promise<{ readonly ok: true } | Failure<'users.not_registered'>> {
  const user = await deps.users.find(caller.id);
  if (!user) return { ok: false, error: 'users.not_registered' };
  if (user.newsOff === on) await deps.users.save({ ...user, newsOff: !on, updatedAt: deps.now() });
  return { ok: true };
}

// The bot may write only if the person allowed it (docs/15): from the app or from the Telegram prompt.
export async function setWriteAccess(
  deps: UsersDeps,
  caller: Caller,
  allowed: boolean,
): Promise<{ readonly ok: true } | Failure<'users.not_registered'>> {
  const user = await deps.users.find(caller.id);
  if (!user) return { ok: false, error: 'users.not_registered' };
  if (user.writeAccess !== allowed) {
    await deps.users.save({ ...user, writeAccess: allowed, updatedAt: deps.now() });
  }
  return { ok: true };
}
