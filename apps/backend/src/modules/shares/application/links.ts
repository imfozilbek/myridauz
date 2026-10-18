import type { Share } from '@platform/contracts';
import { hashToken, newToken, type ShareSubject } from '../domain/share';
import type { SharesDeps } from './ports';

// A new link of a booking or a trip, and the card for Telegram's "send to a chat" window.
export async function issueLink(
  deps: SharesDeps,
  subject: ShareSubject,
  userId: number,
  text: string,
): Promise<Share> {
  const token = newToken();
  await deps.shares.save({
    tokenHash: await hashToken(token),
    subject,
    createdAt: deps.now(),
    revokedAt: null,
  });
  const link = deps.link(token);
  const bot = subject.kind === 'booking' ? 'passenger' : 'driver';
  // «Men ham yoʻlga chiqaman» under the card: the loop «Yaqinlarimga» (G69, docs/123).
  const via = await deps.via(userId);
  return { preparedMessageId: await deps.prepare(bot, userId, text, link, via), link, text };
}

// Every close person of the subject hears the same message from the passenger bot.
export async function tellAll(
  deps: Pick<SharesDeps, 'shares' | 'notify'>,
  subject: ShareSubject,
  text: string,
) {
  const followers = await deps.shares.followers(subject);
  await deps.notify(followers.map((chatId) => ({ bot: 'passenger' as const, chatId, text })));
}
