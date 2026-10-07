import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import type { PlaceDirectory } from '../places/directory';
import type { Route } from '../places/route-screen';
import { NotifyMe } from '../subscriptions/notify-me';
import { ChannelCard } from './channel-card';
import { useChannelOffer } from './channel-offer';
import { WayRow } from './way-row';
import './learn.css';
import './channel-card.css';

type Props = {
  readonly route: Route;
  readonly region: Location | undefined;
  readonly date: string;
  readonly directory: PlaceDirectory;
  // No trips this day: the strongest place, three ways (docs/119, mockup 7-channels-1, screen 2).
  readonly empty: boolean;
  readonly onRequest: () => void;
};

// How to know about new trips (docs/119): the channel of the direction and «Xabar bering» under the
// list; with no trips also «Soʻrov qoldirish».
export function LearnBlock({ route, region, date, directory, empty, onRequest }: Props) {
  const { t } = useI18n();
  const { channel, close } = useChannelOffer(route, directory);
  const [notify, setNotify] = useState(false);
  return (
    <div className="learn">
      {empty ? (
        <div className="learn-empty">
          <span className="learn-empty-icon">
            <Icon name="empty" size={24} />
          </span>
          <span className="learn-empty-title">{t('find.noTrips')}</span>
          <span className="learn-empty-hint">{t('find.emptyHint')}</span>
        </div>
      ) : (
        <p className="find-head">{t('find.learn')}</p>
      )}
      {channel ? <ChannelCard channel={channel} region={region} onClose={close} /> : null}
      {notify ? (
        <NotifyMe from={route.from.id} to={route.to.id} date={date} open />
      ) : (
        <WayRow
          icon="subscriptions"
          title={t('subscriptions.notify')}
          hint={t('find.notifyHint')}
          onClick={() => setNotify(true)}
        />
      )}
      {empty ? (
        <WayRow
          icon="request"
          title={t('common.passenger.leaveRequest')}
          hint={t('common.passenger.leaveRequestHint')}
          onClick={onRequest}
        />
      ) : null}
    </div>
  );
}
