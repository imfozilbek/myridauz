import type { Booking, DriverMeetStep } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { meetStep } from './meet-state';
import { useNoShowText } from './no-show-text';
import './meet-actions.css';

const ICON = 22;

type Props = { readonly booking: Booking; readonly onMark: (step: DriverMeetStep) => void };

// The main action at a point (mockup g63/4 screen 13): «Men keldim», then «Keldi» and «Kelmadi»;
// once answered, what was marked.
export function MeetActions({ booking, onMark }: Props) {
  const { t } = useI18n();
  const noShow = useNoShowText()(booking);
  const step = meetStep(booking);
  if (step === 'come')
    return (
      <button type="button" className="meet-main" onClick={() => onMark('came')}>
        <Icon name="pickup" size={ICON} />
        {t('bookings.meeting.came')}
      </button>
    );
  // A pair of a decision: the refusal on the left, the main action on the right (docs/121).
  if (step === 'answer')
    return (
      <div className="meet-answer">
        <button type="button" className="meet-main meet-no" onClick={() => onMark('no_show')}>
          <Icon name="close" size={ICON} />
          {t('complaints.reason.no_show')}
        </button>
        <button type="button" className="meet-main" onClick={() => onMark('met')}>
          <Icon name="selected" size={ICON} />
          {t('driverAfter.meet.met')}
        </button>
      </div>
    );
  return step === 'met' ? (
    <p className="meet-done">
      <Icon name="selected" size={ICON} />
      {t('driverAfter.meet.met')}
    </p>
  ) : (
    <p className="meet-done meet-done-no">{noShow}</p>
  );
}
