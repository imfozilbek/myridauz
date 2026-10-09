import type { ChatClient } from '@platform/api-client';
import type { ChatAbout, UnreadChat } from '@platform/contracts';
import { otherSide } from '../../call/other-side';
import { useOpenChat } from '../../chat/open-chat';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { useLoad } from '../../market/use-list';
import { noonOf } from '../../market/when';
import type { PlaceDirectory } from '../../places/directory';
import { itemKey, type ActionItem } from '../action-item';
import { QuoteBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

const READY = ['sheet.message.ok', 'sheet.message.wait', 'sheet.message.where'] as const;

// Who is in a chat changes seldom: one question per chat while the app is open.
const known = new Map<string, Promise<ChatAbout>>();
const aboutOf = (chat: ChatClient, key: string) => {
  const asked = known.get(key) ?? chat.about(key);
  known.set(key, asked);
  return asked;
};

// When and where the trip of a chat goes: the booking, the offer, or the day of the request.
const wayOf = ({ booking, offer, request }: ChatAbout) =>
  booking
    ? { at: booking.trip.departAt, to: booking.trip.to }
    : offer
      ? { at: offer.departAt, to: offer.to }
      : request
        ? { at: noonOf(request.date).getTime(), to: request.to, day: true }
        : null;

type Unread = UnreadChat & { readonly about: ChatAbout };

// «Yangi xabar» (docs/122, mockup g68/8 «Xabar»): who wrote about which trip, the words, ready
// answers in one tap; «Javob yozish» opens the chat. A chat open on the screen is never unread.
export function useMessageItems(directory: PlaceDirectory): ActionItem[] {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const openChat = useOpenChat();
  const words = useSheetWords(directory);
  const { value, refresh } = useLoad<Unread[]>(async () => {
    const chats = await chat.unread();
    const abouts = await Promise.all(chats.map((one) => aboutOf(chat, one.key)));
    return chats.map((one, index) => ({ ...one, about: abouts[index] as ChatAbout }));
  });
  return (value ?? []).flatMap((one) => {
    const side = otherSide(one.about);
    if (!side) return [];
    const way = wayOf(one.about);
    const when = way ? (way.day ? words.day(way.at) : words.when(way.at)) : null;
    const item: ActionItem = {
      key: itemKey('message', one.key),
      kind: 'message',
      face: { id: side.id, name: side.firstName, hasAvatar: side.hasAvatar },
      badge: 'write',
      kicker: t('sheet.message.kicker'),
      title: side.firstName,
      ...(way && when ? { sub: t('sheet.message.trip', { when, to: words.place(way.to) }) } : {}),
      body: <QuoteBlock text={one.text} />,
      chips: READY.map((key) => ({
        label: t(key),
        run: async () => {
          await chat.answer(one.key, t(key));
          await refresh();
          return t('sheet.message.sent');
        },
      })),
      main: {
        label: t('sheet.message.write'),
        icon: 'write',
        run: () => {
          openChat(one.key);
          return undefined;
        },
      },
    };
    return [item];
  });
}
