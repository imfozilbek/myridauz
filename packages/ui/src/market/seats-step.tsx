import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, IconButton, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { Switch } from '../switch';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

type Seats = { readonly seats: number; readonly womanOnBoard: boolean };

type Props = {
  // The seats of the car: one chair each (docs/35).
  readonly max: number;
  readonly initial: Seats;
  // A woman driver: «ayol bor» by herself, nothing to ask (docs/06).
  readonly askWoman: boolean;
  readonly onBack: () => void;
  readonly onDone: (value: Seats) => void;
};

// The free seats by the chairs of the car, tap the third: 3 seats (G38, docs/103 point 8). Fewer
// than the car has: somebody already goes, and the switch «Mashinada ayol bor» is right here.
export function SeatsStep({ max, initial, askWoman, onBack, onDone }: Props) {
  useScreenView('market.seats');
  const { t } = useI18n();
  const [seats, setSeats] = useState(Math.min(initial.seats, max));
  const [woman, setWoman] = useState(initial.womanOnBoard);
  const someone = askWoman && seats < max;
  const pick = (count: number) => {
    haptic.select();
    setSeats(count);
  };
  return (
    <StepLayout icon="passengers" title={t('market.seats.title')}>
      <Screen onBack={onBack} />
      <div className="seat-chairs" role="radiogroup" aria-label={t('market.seats.title')}>
        {Array.from({ length: max }, (_, index) => (
          <IconButton
            key={index}
            size="l"
            mode={index < seats ? 'bezeled' : 'gray'}
            role="radio"
            aria-checked={index + 1 === seats}
            aria-label={t('market.trip.seats', { count: index + 1 })}
            onClick={() => pick(index + 1)}
          >
            <Icon name="seats" />
          </IconButton>
        ))}
      </div>
      <Text className="seat-count">{t('market.trip.seats', { count: seats })}</Text>
      {someone ? (
        <List>
          <Section>
            <Cell after={<Switch checked={woman} onChange={() => setWoman(!woman)} />}>
              {t('market.search.woman')}
            </Cell>
          </Section>
        </List>
      ) : null}
      <MainButton
        text={t('common.continue')}
        onClick={() => onDone({ seats, womanOnBoard: someone && woman })}
      />
    </StepLayout>
  );
}
