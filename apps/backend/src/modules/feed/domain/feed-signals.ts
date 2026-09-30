import type { MiniApp } from '@platform/contracts';

// A bot message tells a person that another person acted (docs/64, G19). The same moment the
// Mini App of that bot hears "something changed". A channel post ("@username") is nobody's screen.
type Message = { readonly bot: MiniApp; readonly chatId: number | string };
export type FeedSignal = { readonly userId: number; readonly app: MiniApp };

export function signalsOf(messages: readonly Message[]): FeedSignal[] {
  const seen = new Set<string>();
  const signals: FeedSignal[] = [];
  for (const { bot, chatId } of messages) {
    if (typeof chatId !== 'number') continue;
    const key = `${chatId}:${bot}`;
    if (seen.has(key)) continue;
    seen.add(key);
    signals.push({ userId: chatId, app: bot });
  }
  return signals;
}

// One Durable Object per person: its sockets are that person's open Mini Apps.
export const feedName = (userId: number) => `u${userId}`;
