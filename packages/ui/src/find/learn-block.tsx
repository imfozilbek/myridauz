import type { Location } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from '../places/directory';
import type { Route } from '../places/route-screen';
import { NotifyMe } from '../subscriptions/notify-me';
import { ChannelCard, ChannelRow } from './channel-card';
import { useChannelOffer } from './channel-offer';
import { WayRow } from './way-row';
import './learn.css';
import './channel-card.css';

// The tile of «Hozircha safar yoʻq» is small, as the mockup drew it (G78 sheet 2).
const SMALL = 18;

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
// list. The empty day says so and gives three ways in one card, rows of one kind (G78 sheet 2).
export function LearnBlock({ route, region, date, directory, empty, onRequest }: Props) {
  const { t } = useI18n();
  const { channel, close } = useChannelOffer(route, directory);
  const notify = <NotifyMe from={route.from.id} to={route.to.id} date={date} />;
  if (empty)
    return (
      <div className="learn">
        <div className="learn-one">
          <WayRow
            icon="empty"
            tone="muted"
            iconSize={SMALL}
            title={t('find.noTrips')}
            hint={t('find.emptyHint')}
          />
          {channel ? <ChannelRow channel={channel} region={region} onClose={close} /> : null}
          {notify}
          <WayRow
            icon="request"
            title={t('common.passenger.leaveRequest')}
            hint={t('common.passenger.leaveRequestHint')}
            onClick={onRequest}
          />
        </div>
      </div>
    );
  return (
    <div className="learn">
      <p className="find-head">{t('find.learn')}</p>
      {channel ? <ChannelCard channel={channel} region={region} onClose={close} /> : null}
      {notify}
    </div>
  );
}
