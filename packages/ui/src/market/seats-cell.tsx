import { Button } from '@telegram-apps/telegram-ui';
import { Cell } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import './market.css';

type Props = {
  readonly seats: number;
  // The free seats of the trip, or the most a request may ask (docs/35).
  readonly most: number;
  readonly onSeats: (seats: number) => void;
};

// How many people go (G35, docs/97 K3): 1 at first, «−» and «+» in the check, no step of its own.
// The booking and the request ask with the same words (PS13).
export function SeatsCell({ seats, most, onSeats }: Props) {
  const { t } = useI18n();
  const change = (by: number) => {
    haptic.select();
    onSeats(Math.min(most, Math.max(1, seats + by)));
  };
  const step = (by: number) => (
    <Button
      mode="bezeled"
      size="s"
      className="seats-step"
      aria-label={t(by < 0 ? 'market.price.less' : 'market.price.more')}
      disabled={by < 0 ? seats <= 1 : seats >= most}
      onClick={() => change(by)}
    >
      <Icon name={by < 0 ? 'less' : 'more'} />
    </Button>
  );
  return (
    <Cell
      before={<IconTile name="passengers" />}
      subtitle={t('market.request.seats', { count: String(seats) })}
      after={
        <span className="seats-stepper">
          {step(-1)}
          {step(1)}
        </span>
      }
    >
      {t('market.requestSeats.title')}
    </Cell>
  );
}
