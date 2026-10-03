import type { Booking } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { List, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { RouteView } from '../market/route-view';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { AnswerDeadline } from './answer-deadline';

type Props = { readonly booking: Booking; readonly onClose: () => void; readonly onSee: () => void };

// «Soʻrov yuborildi» (G35, docs/97 PS15): what was asked and until when the driver answers.
export function BookSent({ booking, onClose, onSee }: Props) {
  const { t } = useI18n();
  const { trip } = booking;
  return (
    <StepLayout icon="selected" title={t('bookings.sent.title')} hint={t('bookings.sent.hint')}>
      <Screen onBack={onClose} />
      <List>
        <Section header={t('bookings.sent.asked')}>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
        </Section>
        <AnswerDeadline booking={booking} />
      </List>
      <MainButton text={t('bookings.sent.see')} onClick={onSee} />
    </StepLayout>
  );
}
