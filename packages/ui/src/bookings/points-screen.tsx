import type { ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import './book-points.css';

type End = 'pickup' | 'dropoff';
type Props = {
  readonly sub: string;
  // The names of both ends, null while not chosen.
  readonly start: string | null;
  readonly end: string | null;
  readonly onEnd: (end: End) => void;
  // The card of «Hammasi»: the seats and the sum of a booking, the people and the price of a request.
  readonly children: ReactNode;
  readonly hint: string;
  readonly error: string | null;
  readonly button: string;
  readonly onSend: () => void;
  readonly onBack: () => void;
};

// «Qayerdan, qayerga?» (G59 a booking, G61 a request, docs/118 paths 2 and 4): one screen. A row
// opens the map of its end, «Hammasi» is what goes, the main button sends.
export function PointsScreen({
  sub,
  start,
  end,
  onEnd,
  children,
  hint,
  error,
  button,
  onSend,
  onBack,
}: Props) {
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const row = (kind: End, value: string | null) => (
    <button type="button" className="points-row" onClick={() => onEnd(kind)}>
      <span className={`points-tile points-${kind}`}>
        <Icon name="destination" size={20} />
      </span>
      <span className="points-text">
        <span className="points-label">{t(kind === 'pickup' ? 'way.book.pickup' : 'way.book.dropoff')}</span>
        <span className={value ? 'points-value' : 'points-value points-empty'}>
          {value ?? t('places.choose')}
        </span>
      </span>
      {value ? <span className="points-change">{t('way.change')}</span> : <Icon name="next" size={18} />}
    </button>
  );
  return (
    <div className="find points" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="points-title">{t('bookings.points.title')}</h1>
      <p className="points-sub">{sub}</p>
      <div className="points-card">
        {row('pickup', start)}
        {row('dropoff', end)}
      </div>
      <p className="find-head points-head">{t('bookings.points.all')}</p>
      {children}
      <p className="points-hint">{hint}</p>
      {error ? <p className="points-error">{error}</p> : null}
      <MainButton text={button} onClick={onSend} />
    </div>
  );
}
