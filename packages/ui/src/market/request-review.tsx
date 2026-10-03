import { REQUEST_MAX_SEATS, type Pitak } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Banner, Cell, List, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { PointRow } from '../way/point-row';
import { rememberWay } from '../way/remembered-way';
import { useNameText } from '../way/way-end';
import { errorKey } from './error-text';
import { ExistingRequest } from './existing-request';
import type { RequestAnswer, RequestStepName } from './new-request-state';
import { PlacesGate } from './places-gate';
import { RouteView } from './route-view';
import { SeatsCell } from './seats-cell';
import { noonOf } from './when';

type Props = {
  readonly answer: RequestAnswer;
  readonly pitak: Pitak | null | undefined;
  readonly onSeats: (seats: number) => void;
  // «Oʻzgartirish» of the way or of a point (G35, docs/97 K4).
  readonly onChange: (step: RequestStepName) => void;
  readonly onBack: () => void;
  readonly onSent: () => void;
};

const MODE_ICONS = { door: 'door', pitak: 'pitak', both: 'anyWay' } as const;

// The check of a request (docs/09): the route, the day, the way, both points, the people, the
// price. Sent, the way is kept for the next search on this route (G35, docs/97 K4).
export function RequestReview({ answer, pitak, onSeats, onChange, onBack, onSent }: Props) {
  const { t, formatMoney, formatDate } = useI18n();
  const { market } = useApiClients();
  const nameText = useNameText();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  // A request on this route and day is already open: the button opens it (G37, docs/101 R5).
  const [mine, setMine] = useState(false);
  const { route, date, mode, pickup, dropoff, price } = answer;
  const seats = answer.seats ?? 1;
  const publish = async () => {
    if (!route || !date || !mode || !dropoff?.point || !price) return;
    setError(null);
    try {
      const at = mode === 'pitak' ? null : (pickup?.point ?? null);
      const where = { pickupMode: mode, pickup: at, dropoff: dropoff.point };
      await market.publishRequest({ from: route.from.id, to: route.to.id, date, seats, price, ...where });
      rememberWay(route.from.id, route.to.id, { mode, pickup: pickup ?? null, dropoff });
      haptic.success();
      onSent();
    } catch (caught) {
      haptic.error();
      setError(errorKey(caught));
    }
  };
  const line = (icon: IconName, label: string, value: string) => (
    <Cell before={<IconTile name={icon} />} after={<CellValue>{value}</CellValue>}>
      {label}
    </Cell>
  );
  const exists = error === 'errors.trips.request_exists';
  // Back from the open request (cancelled, or only looked at): this request can be left again.
  const closeMine = () => {
    setMine(false);
    setError(null);
  };
  if (mine && route && date)
    return (
      <PlacesGate onBack={closeMine}>
        <ExistingRequest from={route.from.id} to={route.to.id} date={date} onClose={closeMine} />
      </PlacesGate>
    );
  const start = mode === 'pitak' ? (pitak?.name ?? '') : pickup ? nameText(pickup.name, pickup.place) : '';
  return (
    <PlacesGate>
      <StepLayout
        icon="request"
        title={t('market.request.review.title')}
        hint={t('market.request.review.hint')}
      >
        <Screen onBack={onBack} />
        {exists ? (
          <Banner type="section" before={<IconTile name="request" tone="accent" />} header={t(error)} />
        ) : null}
        <List>
          <Section>
            {route ? (
              <div className="route-summary">
                <RouteView from={route.from.id} to={route.to.id} />
              </div>
            ) : null}
            {line('day', t('market.review.when'), date ? formatDate(noonOf(date)) : '')}
            {pitak && mode ? (
              <PointRow
                icon={MODE_ICONS[mode]}
                label={t('way.mode.title')}
                text={t(`way.mode.${mode}`)}
                onChange={() => onChange('mode')}
              />
            ) : null}
            <PointRow
              icon="origin"
              label={t('way.book.pickup')}
              text={start}
              {...(mode === 'pitak' ? {} : { onChange: () => onChange('pickup') })}
            />
            {dropoff ? (
              <PointRow
                icon="destination"
                tone="accent"
                label={t('way.book.dropoff')}
                text={nameText(dropoff.name, dropoff.place)}
                onChange={() => onChange('dropoff')}
              />
            ) : null}
            <SeatsCell seats={seats} most={REQUEST_MAX_SEATS} onSeats={onSeats} />
            {line('price', t('market.review.price'), formatMoney(price ?? 0))}
          </Section>
        </List>
        {error && !exists ? <Text className="step-error">{t(error)}</Text> : null}
        {exists ? (
          <MainButton text={t('market.request.openMine')} onClick={() => setMine(true)} />
        ) : (
          <MainButton text={t('market.request.publish')} onClick={publish} />
        )}
      </StepLayout>
    </PlacesGate>
  );
}
