import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';

// The marks of a trip as icons with words (docs/118: «пометки иконками»): the free seats, the woman
// mark, how the driver picks up.
export function TripFacts({ trip }: { readonly trip: Trip }) {
  const { t } = useI18n();
  const mode = trip.pickupMode === 'both' ? 'both' : trip.pickupMode === 'door' || !trip.pitak ? 'door' : 'pitak';
  const facts: [IconName, string][] = [
    ['profile', t('market.trip.seats', { count: String(trip.seatsLeft) })],
    ...(trip.woman ? [['female', t('market.search.woman')] as [IconName, string]] : []),
    [mode === 'pitak' ? 'pitak' : 'door', t(`find.mode.${mode}`)],
  ];
  return (
    <div className="safar-facts">
      {facts.map(([icon, text]) => (
        <span key={text} className="safar-fact">
          <Icon name={icon} size={17} />
          {text}
        </span>
      ))}
    </div>
  );
}
