import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';
import type { TripStep } from './trip-stage';

type Props = {
  readonly step: TripStep;
  // What the step does on the server: «Yoʻlga chiqdim» and «Yetib keldik» of the trip (G63 B1).
  readonly onPress: (step: TripStep) => unknown;
};

// The main button of Telegram on «Mening safarim» (owner decision 06.10.2026, mockup g63/3 C):
// «Yoʻlga chiqdim» from the hour before the departure, then «Yetib keldik» (tripStep).
export function TripMainButton({ step, onPress }: Props) {
  const { t } = useI18n();
  return <MainButton text={t(`driverTrip.main.${step}`)} onClick={() => onPress(step)} />;
}
