import type { Page } from '@playwright/test';
import { botOf, draw, escape } from './first-contact-kit';
import type { BotMessage } from './stand-tools';

// The chat of one person with one bot as Telegram shows it, for the snapshots of G68 (docs/152):
// every message in its last form (an edit replaces it), the answered card quoted above a ring,
// the pinned card on top, the HTML marks of the bots and the rows of buttons under a message.
type Shown = { readonly id: number; text: string; rows: BotMessage['rows']; replyTo: number | null };

function chatOf(messages: readonly BotMessage[]) {
  const shown = new Map<number, Shown>();
  let pinned: number | null = null;
  for (const message of messages) {
    const { messageId, method, target, text, rows, replyTo } = message;
    if (method === 'sendMessage' && messageId !== null)
      shown.set(messageId, { id: messageId, text, rows, replyTo });
    const old = target === null ? undefined : shown.get(target);
    if (method === 'editMessageText' && old) Object.assign(old, { text, rows });
    if (method === 'deleteMessage' && target !== null) shown.delete(target);
    if (method === 'pinChatMessage') pinned = target;
    if (method === 'unpinChatMessage' && pinned === target) pinned = null;
  }
  return { list: [...shown.values()], pinned: pinned === null ? undefined : shown.get(pinned) };
}

// The first line as plain text: escaped first, so the marks of the bots are harmless text to drop.
const firstLine = (text: string) => escape(text.split('\n')[0] ?? '').replace(/&lt;\/?[a-z]+.*?&gt;/gu, '');
const keysOf = (rows: Shown['rows']) =>
  rows.length === 0
    ? ''
    : `<div class="keys">${rows
        .map((row) => `<div>${row.map((key) => `<span class="button">${escape(key)}</span>`).join('')}</div>`)
        .join('')}</div>`;

export async function showChat(page: Page, bot: 'passenger' | 'driver', messages: readonly BotMessage[]) {
  const { list, pinned } = chatOf(messages);
  const bubble = (message: Shown) => {
    const quoted = list.find((other) => other.id === message.replyTo);
    const reply = quoted ? `<div class="quote">${firstLine(quoted.text)}</div>` : '';
    // The bots write HTML (parse_mode); Telegram starts the next line right under a quote.
    const text = message.text.replaceAll('</blockquote>\n', '</blockquote>');
    return `<div class="bubble">${reply}${text}</div>${keysOf(message.rows)}`;
  };
  // As tall as the chat: the picture ends with the last message.
  await page.setViewportSize({ width: 390, height: 100 });
  await draw(page, botOf(bot), list.map(bubble).join(''), '', pinned && firstLine(pinned.text));
}
