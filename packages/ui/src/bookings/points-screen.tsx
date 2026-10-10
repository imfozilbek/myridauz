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
  readonly title: string;
  readonly sub: string;
  // The words above the two ends: «Olib ketish joyi» of a booking, «Qayerdan» of a new trip.
  readonly labels: Readonly<Record<End, string>>;
  // The names of both ends, null while not chosen.
  readonly start: string | null;
  readonly end: string | null;
  readonly onEnd: (end: End) => void;
  // The start cannot change: a trip only from its pitak (G75, docs/158 Д).
  readonly fixedStart?: boolean;
  // The head of the card under the ends: «Hammasi» of a booking and a request, «Safar» of a trip.
  readonly head: string;
  // What goes: the seats and the sum of a booking, the people of a request, the trip of a driver.
  readonly children: ReactNode;
  readonly hint?: string;
  readonly error: string | null;
  // No button while the action waits for something else (a driver on the check, G63).
  readonly button: string | null;
  // A promise keeps the button busy until it ends: a second tap sends nothing (docs/65 A4).
  readonly onSend: () => unknown;
  readonly onBack: () => void;
  // The trip of a driver (G63, mockups g63/1, g63/2): smaller rows, the end in the green of a route.
  readonly look?: 'trip';
  // One more row of the card under the two ends: the note of a booking (G63).
  readonly extra?: ReactNode;
};

// The words of a booking and of a request: «Qayerdan, qayerga?», their two ends and «Hammasi».
export function usePassengerWords() {
  const { t } = useI18n();
  return {
    title: t('bookings.points.title'),
    labels: { pickup: t('way.book.pickup'), dropoff: t('way.book.dropoff') },
    head: t('bookings.points.all'),
  };
}

// «Qayerdan, qayerga?» (G59 a booking, G61 a request, docs/118 paths 2 and 4) and «Safar eʼlon
// qilish» (G63, path 6): one screen. A row opens its end, the card under it is what goes, the main
// button sends.
export function PointsScreen(props: Props) {
  const { title, sub, labels, start, end, onEnd, head, children, hint, error, button, onSend, onBack } =
    props;
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const words = (kind: End, value: string | null) => (
    <>
      <span className={`points-tile points-${kind}`}>
        <Icon name="destination" size={props.look ? 18 : 20} />
      </span>
      <span className="points-text">
        <span className="points-label">{labels[kind]}</span>
        <span className={value ? 'points-value' : 'points-value points-empty'}>
          {value ?? t('places.choose')}
        </span>
      </span>
    </>
  );
  const row = (kind: End, value: string | null) =>
    kind === 'pickup' && props.fixedStart ? (
      <div className="points-row">{words(kind, value)}</div>
    ) : (
      <button type="button" className="points-row" onClick={() => onEnd(kind)}>
        {words(kind, value)}
        {value ? <span className="points-change">{t('way.change')}</span> : <Icon name="next" size={18} />}
      </button>
    );
  return (
    <div className={props.look ? 'find points points-trip' : 'find points'} style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="points-title">{title}</h1>
      <p className="points-sub">{sub}</p>
      <div className="points-card">
        {row('pickup', start)}
        {row('dropoff', end)}
        {props.extra}
      </div>
      <p className="find-head points-head">{head}</p>
      {children}
      {hint ? <p className="points-hint">{hint}</p> : null}
      {error ? <p className="points-error">{error}</p> : null}
      {button ? <MainButton text={button} onClick={onSend} /> : null}
    </div>
  );
}
