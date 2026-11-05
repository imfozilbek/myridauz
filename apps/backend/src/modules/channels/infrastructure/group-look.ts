import type { GroupCards } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE, placeEnd, toCyrillic } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { customEmoji, escapeHtml } from '../../../shared/telegram/html';
import type { Post } from './post-life';

const { t } = createI18n(DEFAULT_LOCALE);

// The look of a direction group (docs/223): its chats and how its cards are written.
export type GroupLook = { readonly chats: ReadonlySet<string>; readonly cards: GroupCards };

// What a phone shows where the R tile cannot be drawn: the tiles' own emoji in the set.
const SHOWN = { trip: '🟧', request: '🟦' } as const;
export const groupMark = (cards: GroupCards, kind: keyof typeof SHOWN) =>
  customEmoji(cards.marks[kind], SHOWN[kind]);

// A place by its name and the ending its last letter takes: «Yakkabogʻga», «Muborakka».
export function placeOf(id: string, places: Places) {
  const name = places.get(id)?.name ?? id;
  return { place: escapeHtml(name), end: placeEnd(name) };
}

// «📍 Yunusoboddan (Toshkent shahri), uyingizdan»: a district says its region (mockup docs/223).
export function fromLine(id: string, places: Places, pickup: string): string {
  const { place } = placeOf(id, places);
  const parent = places.get(id)?.parentId;
  const region = parent ? places.get(parent)?.name : undefined;
  if (!region) return t('bot.group.fromAlone', { place, pickup });
  return t('bot.group.from', { place, region: escapeHtml(region), pickup });
}

type Keyboard = { readonly inline_keyboard?: readonly (readonly { readonly text: string }[])[] };

// The post in the group's script: the text and the words of its buttons; the kept words stay Latin.
export function inScript(cards: GroupCards, post: Post, keep: readonly string[] = []): Post {
  if (!cards.cyrillic) return post;
  const markup = post.markup as Keyboard;
  const rows = markup.inline_keyboard?.map((row) =>
    row.map((button) => ({ ...button, text: toCyrillic(button.text, keep) })),
  );
  return {
    ...post,
    text: toCyrillic(post.text, keep),
    markup: rows ? { ...markup, inline_keyboard: rows } : post.markup,
  };
}
