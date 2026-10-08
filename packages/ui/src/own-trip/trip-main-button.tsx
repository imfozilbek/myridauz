import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';
import { STEP_OF, type TripStage, type TripStep } from './trip-stage';

type Props = {
  readonly stage: TripStage;
  // What the step does on the server: «Yoʻlga chiqdim» and «Yetib keldik» of the trip (G63 B1).
  readonly onPress: (step: TripStep) => unknown;
};

// The main button of Telegram on «Mening safarim» (owner decision 06.10.2026, mockup g63/3 C):
// nothing until the hour before the departure, then «Yoʻlga chiqdim», on the way «Yetib keldik».
export function TripMainButton({ stage, onPress }: Props) {
  const { t } = useI18n();
  const step = STEP_OF[stage];
  return step ? <MainButton text={t(`driverTrip.main.${step}`)} onClick={() => onPress(step)} /> : null;
}
