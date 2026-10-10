import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useUnreadChats } from '../chats/unread-chats';
import { HomeTile } from '../flow/home-tile';
import { openInTelegram } from '../telegram/feedback';
import { useWhen } from './home-when';
import type { TripsHint } from './tile-hints';
import { useHomeTap } from './use-home-tap';

// The tiles both roles have in the same places (G76, docs/165, mockup g76/1): 1 «Mening
// safarlarim», 2 «Suhbatlar», 4 «Yordam»; the third is the own tile of the role.
export const CHATS_SECTION = 'chats';

type TripsProps = {
  readonly hint: TripsHint;
  readonly badge: number;
  readonly now: number;
  readonly onOpen: () => void;
};

export function TripsTile({ hint, badge, now, onOpen }: TripsProps) {
  const { t } = useI18n();
  const when = useWhen(now);
  const tap = useHomeTap();
  const words =
    'at' in hint ? when(hint.at) : t(hint.key, 'count' in hint ? { count: String(hint.count) } : {});
  return (
    <HomeTile
      square
      icon="myTrips"
      tone="brand"
      title={t('common.myTrips')}
      hint={words}
      badge={badge}
      onClick={tap('my_trips', onOpen)}
    />
  );
}

// The unread messages of every chat of this Mini App: their number on the tile (G76).
export function ChatsTile({ driver, onOpen }: { readonly driver: boolean; readonly onOpen: () => void }) {
  const { t } = useI18n();
  const tap = useHomeTap();
  const unread = useUnreadChats().reduce((sum, chat) => sum + chat.count, 0);
  const hint =
    unread > 0
      ? t('home.chats.unread', { count: String(unread) })
      : t(driver ? 'home.chats.passengers' : 'home.chats.drivers');
  return (
    <HomeTile
      square
      icon="chat"
      tone="brand"
      title={t('home.chats.title')}
      hint={hint}
      badge={unread}
      onClick={tap('chats', onOpen)}
    />
  );
}

// «Yordam» opens the support bot of the brand (docs/50): an answer in Telegram itself.
export function SupportTile() {
  const { t } = useI18n();
  const { bots } = useBrand();
  const tap = useHomeTap();
  return (
    <HomeTile
      square
      icon="help"
      tone="brand"
      title={t('home.support')}
      hint={t('home.supportHint')}
      onClick={tap('support', () => openInTelegram(`https://t.me/${bots.support}`))}
    />
  );
}
