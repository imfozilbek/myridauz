import { otherSide } from '../../call/other-side';
import { useOpenChat } from '../../chat/open-chat';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { wayOf } from '../../chats/chat-way';
import { useUnreadLoad } from '../../chats/unread-chats';
import type { PlaceDirectory } from '../../places/directory';
import { itemKey, type ActionItem } from '../action-item';
import { QuoteBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

const READY = ['sheet.message.ok', 'sheet.message.wait', 'sheet.message.where'] as const;

// «Yangi xabar» (docs/122, mockup g68/8 «Xabar»): who wrote about which trip, the words, ready
// answers in one tap; «Javob yozish» opens the chat. A chat open on the screen is never unread.
export function useMessageItems(directory: PlaceDirectory): ActionItem[] {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const openChat = useOpenChat();
  const words = useSheetWords(directory);
  const { value, refresh } = useUnreadLoad();
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
