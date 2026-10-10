import { DAY_MS, tashkentDate } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { useI18n } from '../context/i18n-context';
import { useWhen } from '../home/home-when';
import { useCardDay } from '../market/when';
import type { PlaceDirectory } from '../places/directory';
import { useRegionRoute } from '../places/region-route';
import type { ChatRow } from './chat-rows';

const FACE = 44;

type Props = {
  readonly row: ChatRow;
  readonly directory: PlaceDirectory;
  readonly now: number;
  readonly onOpen: () => void;
};

// One chat of «Suhbatlar» (mockup g76/5): the face, the name, when and where the trip goes; an
// unread chat adds the time of its last words, the words bold and their number.
export function ChatCard({ row, directory, now, onOpen }: Props) {
  const { t, formatNumber, formatTime } = useI18n();
  const when = useWhen(now);
  const cardDay = useCardDay();
  const route = useRegionRoute(directory)(row.from, row.to);
  const day = row.day ? cardDay(tashkentDate(row.at), now) : when(row.at);
  const trip = [day, route, ...(row.day ? [t('chat.list.request')] : [])].join(' · ');
  const { unread } = row;
  // The time of the last words: today the time, yesterday «Kecha», else the day.
  const said = (at: number) =>
    tashkentDate(at) === tashkentDate(now)
      ? formatTime(new Date(at))
      : tashkentDate(at) === tashkentDate(now - DAY_MS)
        ? t('chat.list.yesterday')
        : cardDay(tashkentDate(at), now);
  return (
    <button type="button" className="chat-card" onClick={onOpen}>
      <ProfilePhoto
        userId={row.person.id}
        name={row.person.firstName}
        hasAvatar={row.person.hasAvatar}
        size={FACE}
      />
      <span className="chat-card-words">
        <span className="chat-card-top">
          <b>{row.person.firstName}</b>
          {unread ? <time>{said(unread.at)}</time> : null}
        </span>
        <span className="chat-card-trip">{trip}</span>
        {unread ? (
          <span className="chat-card-last">
            <span>{unread.text}</span>
            <span className="chat-card-count">{formatNumber(unread.count)}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}
