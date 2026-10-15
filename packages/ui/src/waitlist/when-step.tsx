import { ROLE_CADENCES, type Cadence, type WaitlistRole } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { CADENCE_ICONS, WaitlistCell, WaitlistSteps, WaitlistTitle } from './parts';

type Props = {
  readonly role: WaitlistRole;
  readonly route: string;
  readonly onPick: (cadence: Cadence) => void;
};

// «Qachon» (mockup 2, screens 6 and 11): the route above, how often, never a date (owner decision
// 14.10.2026); a tap is the answer and the next step.
export function WhenStep({ role, route, onPick }: Props) {
  useScreenView('waitlist_when');
  const { t } = useI18n();
  return (
    <>
      <WaitlistSteps at={3} />
      <WaitlistTitle title={t(`waitlist.when.${role}`)} />
      <div className="wl-card">
        <WaitlistCell icon="trip" title={route} hint={t('waitlist.route')} />
      </div>
      <div className="wl-card">
        {ROLE_CADENCES[role].map((cadence: Cadence) => (
          <WaitlistCell
            key={cadence}
            icon={CADENCE_ICONS[cadence]}
            title={t(`waitlist.cadence.${cadence}`)}
            onClick={() => onPick(cadence)}
          />
        ))}
      </div>
    </>
  );
}
